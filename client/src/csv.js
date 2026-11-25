export const MAX_CSV_BYTES = 2 * 1024 * 1024;
// il parsing avviene nel browser: il limite deve solo permettere di reimportare un export completo
const MAX_CSV_ROWS = 5000;

// Celle che un foglio di calcolo interpreterebbe come formula (CSV injection):
// in export vengono precedute da un apostrofo, che l'import rimuove
const FORMULA_START = /^[=+\-@\t\r]/;

// Divide una riga CSV rispettando i campi tra virgolette ("Titolo, con virgola")
// e le virgolette escape ("" -> ")
export function parseCSVLine(line) {
  const fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { fields.push(cur); cur = ''; }
    else cur += ch;
  }
  fields.push(cur);
  return fields;
}

const unguard = (s) => (s.startsWith("'") && FORMULA_START.test(s.slice(1)) ? s.slice(1) : s);

// CSV con header title,genre,type[,watched] (la prima riga viene saltata)
export function parseFilmsCSV(text) {
  return text
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map(line => {
      const [title = '', genre = '', type = '', watched = ''] =
        parseCSVLine(line).map(s => unguard(s.trim()));
      return title ? {
        title,
        genre,
        type: type === 'serie' ? 'serie' : 'film',
        watched: ['1', 'true', 'yes', 'si', 'sì'].includes(watched.toLowerCase()),
      } : null;
    })
    .filter(Boolean)
    .slice(0, MAX_CSV_ROWS);
}

function escapeCSVField(value) {
  let s = String(value ?? '');
  if (FORMULA_START.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Stesso formato dell'import, più la colonna watched: il file esportato si può reimportare
export function filmsToCSV(films) {
  const rows = films.map(f =>
    [f.title, f.genre, f.type, f.watched ? 1 : 0].map(escapeCSVField).join(','));
  return ['title,genre,type,watched', ...rows].join('\r\n') + '\r\n';
}

// BOM UTF-8 per far riconoscere gli accenti a Excel
export function downloadCSV(text, filename) {
  const url = URL.createObjectURL(new Blob(['\uFEFF', text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  // revoca differita: alcuni browser avviano il download in modo asincrono
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
