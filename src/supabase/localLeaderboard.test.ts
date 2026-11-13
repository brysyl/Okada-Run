import { describe, expect, it } from 'vitest';
import { addLocal, sanitizeName, topLocal } from './localLeaderboard';

function memStore() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}

describe('local leaderboard fallback', () => {
  it('sorts by score descending and limits', () => {
    const s = memStore();
    addLocal(s, { name: 'a', score: 10, coins: 1, distance: 5 });
    addLocal(s, { name: 'b', score: 50, coins: 1, distance: 5 });
    addLocal(s, { name: 'c', score: 30, coins: 1, distance: 5 });
    expect(topLocal(s, 2).map((e) => e.name)).toEqual(['b', 'c']);
  });
  it('sanitizes names and floors numbers', () => {
    expect(sanitizeName('  <b>Tunde</b>verylongname ')).toHaveLength(12);
    expect(sanitizeName('')).toBe('RIDER');
    const e = addLocal(memStore(), { name: 'x', score: 12.9, coins: -4, distance: 3.2 });
    expect(e.score).toBe(12);
    expect(e.coins).toBe(0);
  });
  it('survives corrupt storage', () => {
    const s = { getItem: () => '{bad', setItem: () => undefined };
    expect(topLocal(s, 5)).toEqual([]);
  });
});
