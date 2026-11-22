import { useState, useEffect } from 'react';

// La lista vive solo nel browser dell'utente: nessun dato viene salvato sul server.
const STORAGE_KEY = 'randomtime.films';
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

// Legge e valida i dati salvati: localStorage può contenere dati corrotti o modificati a mano
function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
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

export function useFilms() {
  const [films, setFilms] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(films));
    } catch (err) {
      console.warn('Impossibile salvare la lista nel browser:', err);
    }
  }, [films]);

  // Aggiunge i titoli non ancora presenti (confronto senza maiuscole/spazi).
  // Restituisce quanti titoli sono stati effettivamente aggiunti.
  const addMany = (items) => {
    const seen = new Set(films.map(f => titleKey(f.title)));
    let nextId = films.reduce((max, f) => Math.max(max, f.id), 0) + 1;
    const now = new Date().toISOString();
    const added = [];
    for (const item of items) {
      if (!isValidItem(item)) continue;
      const film = normalize(item);
      const k = titleKey(film.title);
      if (seen.has(k)) continue;
      seen.add(k);
      added.push({ ...film, id: nextId++, watched: item.watched === true, created_at: now });
    }
    if (added.length) setFilms([...films, ...added]);
    return added.length;
  };

  const add = (item) => addMany([item]) === 1;

  const toggle = (id) =>
    setFilms(prev => prev.map(f => (f.id === id ? { ...f, watched: !f.watched } : f)));

  const remove = (id) => setFilms(prev => prev.filter(f => f.id !== id));

  return { films, add, addMany, toggle, remove };
}
