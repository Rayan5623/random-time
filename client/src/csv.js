export const MAX_CSV_BYTES = 1024 * 1024;
const MAX_CSV_ROWS = 500;

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

// CSV con header title,genre,type (la prima riga viene saltata)
export function parseFilmsCSV(text) {
  return text
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map(line => {
      const [title = '', genre = '', type = ''] = parseCSVLine(line).map(s => s.trim());
      return title ? { title, genre, type: type === 'serie' ? 'serie' : 'film' } : null;
    })
    .filter(Boolean)
    .slice(0, MAX_CSV_ROWS);
}
