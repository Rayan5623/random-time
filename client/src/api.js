const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

// Stessi limiti del server: controllarli qui evita upload inutili
// e di consumare la quota giornaliera di estrazioni
export const MAX_IMAGE_BYTES = 3.75 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Errore con un codice (ERR_*) da tradurre tramite i18n
export class AppError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

export async function extractTitles(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new AppError('ERR_INVALID_FILE');
  if (file.size > MAX_IMAGE_BYTES) throw new AppError('ERR_FILE_TOO_LARGE');

  const body = new FormData();
  body.append('image', file);

  let res;
  try {
    res = await fetch(`${API}/api/extract`, { method: 'POST', body });
  } catch {
    throw new AppError('ERR_NETWORK');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new AppError(data?.error || 'ERR_UNKNOWN');
  if (!Array.isArray(data?.films)) throw new AppError('ERR_UNKNOWN');
  return data.films;
}

// Il server gratuito su Render si addormenta dopo un po' di inattività e il primo
// risveglio può richiedere fino a un minuto. Lo "svegliamo" appena si apre l'app,
// così quando l'utente carica uno screenshot di solito è già pronto.
const WAKE_TIMEOUT_MS = 90 * 1000;
let serverAwake = false;
let wakePromise = null;

export const isServerAwake = () => serverAwake;

// Restituisce true se il server ha risposto. Le chiamate contemporanee condividono
// la stessa richiesta; dopo un fallimento la successiva riprova.
export function wakeServer() {
  if (serverAwake) return Promise.resolve(true);
  if (!wakePromise) {
    wakePromise = fetch(`${API}/api/health`, { signal: AbortSignal.timeout(WAKE_TIMEOUT_MS) })
      .then(res => { serverAwake = res.ok; return res.ok; })
      .catch(() => false)
      .finally(() => { wakePromise = null; });
  }
  return wakePromise;
}

// solo per i test
export function resetServerState() {
  serverAwake = false;
  wakePromise = null;
}
