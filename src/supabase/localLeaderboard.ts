import type { LeaderboardEntry, NewScore } from './types';

export const LOCAL_KEY = 'okada-run:leaderboard:v1';
const MAX_STORED = 100;

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function sanitizeName(name: string): string {
  const n = name.replace(/[^\w \-.]/g, '').trim().slice(0, 12);
  return n || 'RIDER';
}

export function readLocal(store: StorageLike): LeaderboardEntry[] {
  try {
    const raw = store.getItem(LOCAL_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as LeaderboardEntry[]) : [];
  } catch {
    return [];
  }
}

export function addLocal(store: StorageLike, s: NewScore, now = new Date()): LeaderboardEntry {
  const entry: LeaderboardEntry = {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    name: sanitizeName(s.name),
    score: Math.max(0, Math.floor(s.score)),
    coins: Math.max(0, Math.floor(s.coins)),
    distance: Math.max(0, Math.floor(s.distance)),
    created_at: now.toISOString(),
  };
  const all = [...readLocal(store), entry].sort((a, b) => b.score - a.score).slice(0, MAX_STORED);
  store.setItem(LOCAL_KEY, JSON.stringify(all));
  return entry;
}

export function topLocal(store: StorageLike, limit: number): LeaderboardEntry[] {
  return readLocal(store).sort((a, b) => b.score - a.score).slice(0, limit);
}
