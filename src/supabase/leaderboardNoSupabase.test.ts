import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({ supabase: null }));

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  });
  vi.stubGlobal('window', { dispatchEvent: vi.fn() });
  vi.stubGlobal('Event', class {});
});

describe('submitScore without Supabase configured', () => {
  it('saves locally with only name/score/coins/distance', async () => {
    const { submitScore } = await import('./leaderboard');
    const r = await submitScore({ name: 'Tunde', score: 10, coins: 1, distance: 5, durationS: 9, maxSpeed: 300, nitroUses: 0 });
    expect(r).toBe('local');
    const saved = JSON.parse([...store.values()][0]);
    expect(Object.keys(saved[0]).sort()).toEqual(['coins', 'created_at', 'distance', 'id', 'name', 'score']);
  });
});
