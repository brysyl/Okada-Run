import { beforeEach, describe, expect, it, vi } from 'vitest';

const insert = vi.fn();
vi.mock('./client', () => ({ supabase: { from: () => ({ insert }) } }));

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  insert.mockReset();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  });
  vi.stubGlobal('window', { dispatchEvent: vi.fn() });
  vi.stubGlobal('Event', class {});
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('submitScore', () => {
  const score = { name: 'Tunde', score: 10, coins: 1, distance: 5 };

  it('reports remote on success', async () => {
    insert.mockResolvedValue({ error: null });
    const { submitScore } = await import('./leaderboard');
    expect(await submitScore(score)).toBe('remote');
    expect(store.size).toBe(0);
  });

  it('falls back to local when the remote insert errors', async () => {
    insert.mockResolvedValue({ error: { message: 'boom' } });
    const { submitScore } = await import('./leaderboard');
    expect(await submitScore(score)).toBe('local');
    expect(store.size).toBe(1);
  });

  it('rejects when the local write also fails', async () => {
    insert.mockResolvedValue({ error: { message: 'boom' } });
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => { throw new Error('quota'); },
    });
    const { submitScore } = await import('./leaderboard');
    await expect(submitScore(score)).rejects.toThrow('quota');
  });
});
