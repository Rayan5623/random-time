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
