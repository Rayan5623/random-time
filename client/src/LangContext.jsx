import { createContext, useContext, useState } from 'react';
import { translations } from './i18n';

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'it');
  const t = translations[lang];
  const toggleLang = () => {
    const next = lang === 'it' ? 'en' : 'it';
    setLang(next);
    localStorage.setItem('lang', next);
  };
  return (
    <LangContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook legato al provider, va tenuto nello stesso file
export const useLang = () => useContext(LangContext);