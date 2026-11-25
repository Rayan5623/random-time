import { describe, it, expect } from 'vitest';
import { parseCSVLine, parseFilmsCSV, filmsToCSV } from './csv';

describe('parseCSVLine', () => {
  it('divide sulle virgole', () => {
    expect(parseCSVLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('rispetta i campi tra virgolette e le virgolette escape', () => {
    expect(parseCSVLine('"Titolo, con virgola","Dice ""ciao""",film'))
      .toEqual(['Titolo, con virgola', 'Dice "ciao"', 'film']);
  });

  it('mantiene i campi vuoti', () => {
    expect(parseCSVLine('a,,')).toEqual(['a', '', '']);
  });
});

describe('parseFilmsCSV', () => {
  it('salta header, BOM e righe senza titolo; accetta CRLF', () => {
    const text = '﻿title,genre,type\r\nInception,Sci-Fi,film\r\n,Drama,film\r\nDark,Thriller,serie\r\n';
    expect(parseFilmsCSV(text)).toEqual([
      { title: 'Inception', genre: 'Sci-Fi', type: 'film', watched: false },
      { title: 'Dark', genre: 'Thriller', type: 'serie', watched: false },
    ]);
  });

  it('il tipo sconosciuto diventa film', () => {
    expect(parseFilmsCSV('title,genre,type\nX,,documentario')[0].type).toBe('film');
  });

  it('riconosce i valori di watched', () => {
    const text = 'title,genre,type,watched\nA,,film,1\nB,,film,true\nC,,film,sì\nD,,film,0\nE,,film,';
    expect(parseFilmsCSV(text).map(f => f.watched)).toEqual([true, true, true, false, false]);
  });

  it('header da solo o file vuoto non producono righe', () => {
    expect(parseFilmsCSV('title,genre,type')).toEqual([]);
    expect(parseFilmsCSV('')).toEqual([]);
  });

  it('limita il numero di righe', () => {
    const rows = Array.from({ length: 5010 }, (_, i) => `T${i},,film`);
    expect(parseFilmsCSV(['title,genre,type', ...rows].join('\n'))).toHaveLength(5000);
  });
});

describe('filmsToCSV', () => {
  it('scrive header, CRLF e watched come 1/0', () => {
    const csv = filmsToCSV([
      { title: 'A', genre: 'Drama', type: 'film', watched: true },
      { title: 'B', genre: '', type: 'serie', watched: false },
    ]);
    expect(csv).toBe('title,genre,type,watched\r\nA,Drama,film,1\r\nB,,serie,0\r\n');
  });

  it('protegge dalle formule (CSV injection)', () => {
    const csv = filmsToCSV([{ title: '=HYPERLINK("x")', genre: '', type: 'film', watched: false }]);
    expect(csv.split('\r\n')[1]).toBe(`"'=HYPERLINK(""x"")",,film,0`);
  });

  it('un export si reimporta identico (round trip)', () => {
    const films = [
      { title: 'Titolo, con virgola', genre: 'Drama, Crime', type: 'film', watched: true },
      { title: 'Dice "ciao"', genre: '', type: 'serie', watched: false },
      { title: '-1 Il film', genre: '@genere', type: 'film', watched: false },
      { title: 'Amélie', genre: 'Commedia', type: 'film', watched: true },
    ];
    expect(parseFilmsCSV(filmsToCSV(films))).toEqual(films);
  });
});
