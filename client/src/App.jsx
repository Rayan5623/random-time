import { useState, useEffect } from 'react';
import { useLang } from './LangContext';
import { useFilms } from './useFilms';
import ImportTab from './components/ImportTab';
import ListTab from './components/ListTab';
import RandomTab from './components/RandomTab';
import './index.css';

export default function App() {
  const { lang, t, toggleLang } = useLang();
  const [tab, setTab] = useState(0);
  const { films, add, addMany, toggle, remove } = useFilms();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const unwatched = films.filter(f => !f.watched).length;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ background: 'linear-gradient(90deg, #7c6af7, #f76ab4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🎬 {t.title}
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: 4 }}>{t.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={toggleLang}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text)', padding: '8px 12px', borderRadius: 'var(--radius)' }}>
            {lang === 'it' ? '🇬🇧' : '🇮🇹'}
          </button>
          <button onClick={() => setDarkMode(prev => !prev)}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text)', padding: '8px 12px', fontSize: 18, borderRadius: 'var(--radius)' }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28,
        background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 4 }}>
        {t.tabs.map((tab_label, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{
              flex: 1, background: tab === i ? 'var(--accent)' : 'transparent',
              color: tab === i ? 'white' : 'var(--muted)',
              borderRadius: 7, padding: '8px 0', fontWeight: tab === i ? 600 : 400
            }}>
            {tab_label}{i === 1 && unwatched > 0 ? ` (${unwatched})` : ''}
          </button>
        ))}
      </div>

      {tab === 0 && <ImportTab addMany={addMany} onImported={() => setTab(1)} />}
      {tab === 1 && <ListTab films={films} add={add} toggle={toggle} remove={remove} />}
      {tab === 2 && <RandomTab films={films} />}

      {/* BuyMeACoffee */}
      <div style={{ textAlign: 'center', marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <a href="https://buymeacoffee.com/couchstudio" target="_blank" rel="noopener noreferrer">
          <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
            alt="Buy Me A Coffee" style={{ height: 45, borderRadius: 8 }} />
        </a>
        <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 8 }}>{t.coffee}</p>
      </div>

    </div>
  );
}