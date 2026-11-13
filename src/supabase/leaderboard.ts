import { supabase } from './client';
import { addLocal, sanitizeName, topLocal } from './localLeaderboard';
import type { LeaderboardEntry, NewScore } from './types';

const TABLE = 'leaderboard';
const LOCAL_EVENT = 'okada-leaderboard-changed';

export async function fetchTopScores(limit = 10): Promise<LeaderboardEntry[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id,name,score,coins,distance,created_at')
      .order('score', { ascending: false })
      .limit(limit);
    if (!error && data) return data as LeaderboardEntry[];
  }
  return topLocal(localStorage, limit);
}

/** Saves to Supabase when configured; always falls back to localStorage on failure. */
export async function submitScore(score: NewScore): Promise<void> {
  const payload: NewScore = {
    name: sanitizeName(score.name),
    score: Math.max(0, Math.floor(score.score)),
    coins: Math.max(0, Math.floor(score.coins)),
    distance: Math.max(0, Math.floor(score.distance)),
  };
  if (supabase) {
    const { error } = await supabase.from(TABLE).insert(payload);
    if (!error) return;
  }
  addLocal(localStorage, payload);
  window.dispatchEvent(new Event(LOCAL_EVENT));
}

/** Live updates: Supabase realtime when configured, otherwise local change events. */
export function subscribeToLeaderboard(onChange: () => void): () => void {
  window.addEventListener(LOCAL_EVENT, onChange);
  const channel = supabase
    ?.channel('leaderboard-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLE }, onChange)
    .subscribe();
  return () => {
    window.removeEventListener(LOCAL_EVENT, onChange);
    if (channel && supabase) void supabase.removeChannel(channel);
  };
}
