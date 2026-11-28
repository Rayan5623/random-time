import { useState, useEffect } from 'react';

// La lista vive solo nel browser dell'utente: nessun dato viene salvato sul server.
export const STORAGE_KEY = 'sortapp.films';
// chiave usata quando l'app si chiamava RandomTime: la lista va spostata, non persa
export const LEGACY_STORAGE_KEY = 'randomtime.films';
const MAX_FIELD_LENGTH = 200;

const titleKey = (title) => title.trim().toLowerCase();

// spazi multipli e a capo diventano un solo spazio (un titolo è sempre su una riga, anche nel CSV)
const clean = (s) => s.replace(/\s+/g, ' ').trim().slice(0, MAX_FIELD_LENGTH);

const normalize = (f) => ({
  title: clean(f.title),
  genre: typeof f.genre === 'string' ? clean(f.genre) : '',
  type: f.type === 'serie' ? 'serie' : 'film',
});

const isValidItem = (f) => f && typeof f.title === 'string' && f.title.trim();

// Valida i dati salvati: localStorage può contenere dati corrotti o modificati a mano
export function parseStored(raw) {
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter(f => isValidItem(f) && Number.isInteger(f.id))
      .map(f => ({
        ...normalize(f),
        id: f.id,
        watched: Boolean(f.watched),
        created_at: typeof f.created_at === 'string' ? f.created_at : null,
      }));
  } catch {
    return [];
  }
}

// Restituisce i titoli di `items` non ancora presenti in `films` (confronto senza
// maiuscole/spazi, anche tra gli item stessi), già normalizzati e con id progressivi.
export function newFilms(films, items, now = new Date().toISOString()) {
  const seen = new Set(films.map(f => titleKey(f.title)));
  let nextId = films.reduce((max, f) => Math.max(max, f.id), 0) + 1;
  const added = [];
  for (const item of items) {
    if (!isValidItem(item)) continue;
    const film = normalize(item);
    const k = titleKey(film.title);
    if (seen.has(k)) continue;
    seen.add(k);
    added.push({ ...film, id: nextId++, watched: item.watched === true, created_at: now });
  }
  return added;
}

const load = () => parseStored(localStorage.getItem(STORAGE_KEY));

// Sposta la lista dalla vecchia chiave alla nuova, solo se la nuova è ancora vuota.
// La vecchia chiave viene rimossa solo dopo che la copia è riuscita.
export function migrateLegacyStorage() {
  try {
    if (localStorage.getItem(STORAGE_KEY) !== null) return;
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy === null) return;
    localStorage.setItem(STORAGE_KEY, legacy);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    console.warn('Impossibile migrare la lista salvata:', err);
  }
}

export function useFilms() {
  const [films, setFilms] = useState(() => {
    migrateLegacyStorage();
    return load();
  });

  useEffect(() => {
    try {
      const json = JSON.stringify(films);
      // scrive solo se cambia: evita di rimbalzare all'infinito gli eventi tra schede
      if (localStorage.getItem(STORAGE_KEY) !== json) localStorage.setItem(STORAGE_KEY, json);
    } catch (err) {
      console.warn('Impossibile salvare la lista nel browser:', err);
    }
  }, [films]);

  // Un'altra scheda ha modificato la lista: si riparte dalla versione salvata,
  // così le due schede non si sovrascrivono a vicenda.
  // key === null significa localStorage.clear()
  useEffect(() => {
    const onStorage = (e) => {
      if (e.storageArea !== localStorage) return;
      if (e.key === STORAGE_KEY || e.key === null) setFilms(load());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Restituisce quanti titoli sono stati effettivamente aggiunti.
  const addMany = (items) => {
    const added = newFilms(films, items);
    if (added.length) setFilms([...films, ...added]);
    return added.length;
  };

  const add = (item) => addMany([item]) === 1;

  const toggle = (id) =>
    setFilms(prev => prev.map(f => (f.id === id ? { ...f, watched: !f.watched } : f)));

  const remove = (id) => setFilms(prev => prev.filter(f => f.id !== id));

  return { films, add, addMany, toggle, remove };
}
