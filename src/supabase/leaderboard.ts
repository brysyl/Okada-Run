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
    console.warn('[leaderboard] remote fetch failed, showing local scores', error);
  }
  return topLocal(localStorage, limit);
}

export type SubmitTarget = 'remote' | 'local';

/**
 * Saves to Supabase when configured and falls back to localStorage on failure.
 * Resolves with where the score landed; rejects only if the local write also fails.
 */
export async function submitScore(score: NewScore): Promise<SubmitTarget> {
  const payload: NewScore = {
    name: sanitizeName(score.name),
    score: Math.max(0, Math.floor(score.score)),
    coins: Math.max(0, Math.floor(score.coins)),
    distance: Math.max(0, Math.floor(score.distance)),
  };
  if (supabase) {
    try {
      // Inserts are server-side only: the edge function validates the run metrics, then writes the row.
      const { data, error } = await supabase.functions.invoke('submit-score', {
        body: {
          ...payload,
          durationS: score.durationS ?? 0,
          maxSpeed: score.maxSpeed ?? 0,
          nitroUses: Math.max(0, Math.floor(score.nitroUses ?? 0)),
        },
      });
      if (!error && data?.ok === true) return 'remote';
      console.warn('[leaderboard] score rejected or failed, saving locally', error ?? data);
    } catch (err) {
      console.warn('[leaderboard] submit-score call failed, saving locally', err);
    }
  }
  addLocal(localStorage, payload);
  window.dispatchEvent(new Event(LOCAL_EVENT));
  return 'local';
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
