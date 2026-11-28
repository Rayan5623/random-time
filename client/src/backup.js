import { useState } from 'react';

// La lista vive solo nel browser: ogni tanto suggeriamo di esportarla in CSV.
const LAST_EXPORT_KEY = 'sortapp.lastExport';
const SNOOZE_KEY = 'sortapp.backupSnoozedUntil';
const DAY_MS = 24 * 60 * 60 * 1000;
export const REMIND_AFTER_DAYS = 14; // giorni dall'ultimo export
export const SNOOZE_DAYS = 7;        // "più tardi"
export const MIN_TITLES = 5;         // per liste piccolissime non vale la pena

export function shouldRemindBackup({ count, lastExport, snoozedUntil, now }) {
  if (count < MIN_TITLES) return false;
  if (snoozedUntil && now < snoozedUntil) return false;
  return !lastExport || now - lastExport >= REMIND_AFTER_DAYS * DAY_MS;
}

// localStorage può essere bloccato (navigazione privata, permessi): il promemoria
// è solo una comodità, quindi in caso di errore si va avanti senza.
const readTime = (key) => {
  try {
    const n = Number(localStorage.getItem(key));
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
};
const writeTime = (key, value) => {
  try { localStorage.setItem(key, String(value)); } catch { /* ignorato */ }
};

export function useBackupReminder(count) {
  // l'ora viene letta una volta all'apertura della scheda: il render resta puro e,
  // per un promemoria che scatta dopo giorni, la precisione al secondo non serve
  const [times, setTimes] = useState(() => ({
    lastExport: readTime(LAST_EXPORT_KEY),
    snoozedUntil: readTime(SNOOZE_KEY),
    openedAt: Date.now(),
  }));

  const { lastExport, snoozedUntil, openedAt } = times;
  const show = shouldRemindBackup({ count, lastExport, snoozedUntil, now: openedAt });

  const markExported = () => {
    const now = Date.now();
    writeTime(LAST_EXPORT_KEY, now);
    setTimes(prev => ({ ...prev, lastExport: now }));
  };

  const snooze = () => {
    const until = Date.now() + SNOOZE_DAYS * DAY_MS;
    writeTime(SNOOZE_KEY, until);
    setTimes(prev => ({ ...prev, snoozedUntil: until }));
  };

  return { show, markExported, snooze };
}
