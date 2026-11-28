import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { wakeServer, isServerAwake, resetServerState } from './api';

describe('wakeServer', () => {
  beforeEach(() => resetServerState());
  afterEach(() => vi.unstubAllGlobals());

  it('chiama /api/health una sola volta anche con chiamate contemporanee', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const [a, b] = await Promise.all([wakeServer(), wakeServer()]);
    expect([a, b]).toEqual([true, true]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/health$/);
    expect(isServerAwake()).toBe(true);

    // già sveglio: nessuna nuova richiesta
    await wakeServer();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('dopo un errore di rete restituisce false e la chiamata successiva riprova', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    expect(await wakeServer()).toBe(false);
    expect(isServerAwake()).toBe(false);
    expect(await wakeServer()).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
