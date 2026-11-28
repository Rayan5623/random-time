// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { parseStored, newFilms, useFilms, STORAGE_KEY, LEGACY_STORAGE_KEY } from './useFilms';

describe('migrazione dalla vecchia chiave', () => {
  beforeEach(() => localStorage.clear());

  it('sposta la lista da randomtime.films a sortapp.films', () => {
    const old = JSON.stringify([{ id: 1, title: 'Dune', watched: true }]);
    localStorage.setItem(LEGACY_STORAGE_KEY, old);
    const { result } = renderHook(() => useFilms());
    expect(result.current.films.map(f => [f.title, f.watched])).toEqual([['Dune', true]]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))[0].title).toBe('Dune');
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  it('non sovrascrive una lista già presente sotto la nuova chiave', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 1, title: 'Nuova' }]));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify([{ id: 1, title: 'Vecchia' }]));
    const { result } = renderHook(() => useFilms());
    expect(result.current.films.map(f => f.title)).toEqual(['Nuova']);
  });
});

describe('parseStored', () => {
  it('restituisce [] per dati assenti, corrotti o non array', () => {
    expect(parseStored(null)).toEqual([]);
    expect(parseStored('{non json')).toEqual([]);
    expect(parseStored('{"a":1}')).toEqual([]);
  });

  it('scarta elementi senza titolo o senza id intero e normalizza gli altri', () => {
    const raw = JSON.stringify([
      { id: 1, title: '  Inception \n ', genre: 42, type: 'boh', watched: 'yes', created_at: 5 },
      { id: 2, title: '   ' },
      { id: '3', title: 'Id stringa' },
      { title: 'Senza id' },
      null,
    ]);
    expect(parseStored(raw)).toEqual([
      { id: 1, title: 'Inception', genre: '', type: 'film', watched: true, created_at: null },
    ]);
  });
});

describe('newFilms', () => {
  const existing = [{ id: 7, title: 'Inception', genre: '', type: 'film', watched: false, created_at: null }];

  it('salta i duplicati ignorando maiuscole e spazi, anche tra i nuovi', () => {
    const added = newFilms(existing, [
      { title: ' inception ' },
      { title: 'Dark', type: 'serie' },
      { title: 'DARK' },
    ], 'T');
    expect(added).toEqual([
      { id: 8, title: 'Dark', genre: '', type: 'serie', watched: false, created_at: 'T' },
    ]);
  });

  it('ignora item non validi e assegna id dopo il massimo esistente', () => {
    const added = newFilms(existing, [null, { title: '' }, { title: 'A' }, { title: 'B', watched: true }], 'T');
    expect(added.map(f => [f.id, f.title, f.watched])).toEqual([[8, 'A', false], [9, 'B', true]]);
  });

  it('su lista vuota parte da id 1', () => {
    expect(newFilms([], [{ title: 'A' }])[0].id).toBe(1);
  });
});

describe('useFilms', () => {
  beforeEach(() => localStorage.clear());

  it('salva le modifiche in localStorage', () => {
    const { result } = renderHook(() => useFilms());
    act(() => { result.current.add({ title: 'Dune' }); });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))[0].title).toBe('Dune');

    act(() => { result.current.toggle(1); });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))[0].watched).toBe(true);

    act(() => { result.current.remove(1); });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual([]);
  });

  it('add restituisce false per un duplicato', () => {
    const { result } = renderHook(() => useFilms());
    let first, second;
    act(() => { first = result.current.add({ title: 'Dune' }); });
    act(() => { second = result.current.add({ title: 'dune' }); });
    expect([first, second]).toEqual([true, false]);
    expect(result.current.films).toHaveLength(1);
  });

  it('si aggiorna quando un\'altra scheda modifica la lista', () => {
    const { result } = renderHook(() => useFilms());
    act(() => { result.current.add({ title: 'Locale' }); });

    // simula la scrittura di un'altra scheda
    const other = JSON.stringify([{ id: 1, title: 'Da altra scheda', watched: false }]);
    localStorage.setItem(STORAGE_KEY, other);
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEY, newValue: other, storageArea: localStorage,
      }));
    });
    expect(result.current.films.map(f => f.title)).toEqual(['Da altra scheda']);

    // la scheda successiva aggiunge in coda alla lista sincronizzata, senza perdere nulla
    act(() => { result.current.add({ title: 'Nuovo' }); });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).map(f => f.title))
      .toEqual(['Da altra scheda', 'Nuovo']);
  });

  it('svuota la lista se un\'altra scheda fa localStorage.clear()', () => {
    const { result } = renderHook(() => useFilms());
    act(() => { result.current.add({ title: 'Dune' }); });
    localStorage.clear();
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }));
    });
    expect(result.current.films).toEqual([]);
  });

  it('ignora le modifiche ad altre chiavi', () => {
    const { result } = renderHook(() => useFilms());
    act(() => { result.current.add({ title: 'Dune' }); });
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'altro', storageArea: localStorage }));
    });
    expect(result.current.films).toHaveLength(1);
  });
});
