// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { shouldRemindBackup, useBackupReminder, MIN_TITLES, REMIND_AFTER_DAYS } from './backup';

const DAY = 24 * 60 * 60 * 1000;
const now = Date.UTC(2026, 10, 28);

describe('shouldRemindBackup', () => {
  it('non ricorda nulla per liste troppo piccole', () => {
    expect(shouldRemindBackup({ count: MIN_TITLES - 1, lastExport: null, snoozedUntil: null, now })).toBe(false);
  });

  it('ricorda se non si è mai esportato', () => {
    expect(shouldRemindBackup({ count: MIN_TITLES, lastExport: null, snoozedUntil: null, now })).toBe(true);
  });

  it('ricorda solo dopo REMIND_AFTER_DAYS dall\'ultimo export', () => {
    const recent = now - (REMIND_AFTER_DAYS - 1) * DAY;
    const old = now - REMIND_AFTER_DAYS * DAY;
    expect(shouldRemindBackup({ count: 10, lastExport: recent, snoozedUntil: null, now })).toBe(false);
    expect(shouldRemindBackup({ count: 10, lastExport: old, snoozedUntil: null, now })).toBe(true);
  });

  it('rispetta il "più tardi" finché non scade', () => {
    expect(shouldRemindBackup({ count: 10, lastExport: null, snoozedUntil: now + 1, now })).toBe(false);
    expect(shouldRemindBackup({ count: 10, lastExport: null, snoozedUntil: now, now })).toBe(true);
  });
});

describe('useBackupReminder', () => {
  beforeEach(() => localStorage.clear());

  it('sparisce dopo un export e resta nascosto alla riapertura', () => {
    const { result } = renderHook(() => useBackupReminder(10));
    expect(result.current.show).toBe(true);
    act(() => result.current.markExported());
    expect(result.current.show).toBe(false);
    expect(renderHook(() => useBackupReminder(10)).result.current.show).toBe(false);
  });

  it('sparisce con "più tardi" e resta nascosto alla riapertura', () => {
    const { result } = renderHook(() => useBackupReminder(10));
    act(() => result.current.snooze());
    expect(result.current.show).toBe(false);
    expect(renderHook(() => useBackupReminder(10)).result.current.show).toBe(false);
  });

  it('ignora valori salvati non validi', () => {
    localStorage.setItem('sortapp.lastExport', 'boh');
    expect(renderHook(() => useBackupReminder(10)).result.current.show).toBe(true);
  });
});
