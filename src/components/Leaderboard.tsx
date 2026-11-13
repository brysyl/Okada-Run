import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '../supabase/client';
import { fetchTopScores, subscribeToLeaderboard } from '../supabase/leaderboard';
import type { LeaderboardEntry } from '../supabase/types';

export function Leaderboard({ limit = 8 }: { limit?: number }) {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    let alive = true;
    const load = () => {
      void fetchTopScores(limit).then((r) => { if (alive) setRows(r); });
    };
    load();
    const unsub = subscribeToLeaderboard(load);
    return () => { alive = false; unsub(); };
  }, [limit]);

  return (
    <div className="w-full text-left font-arcade text-[10px]">
      <div className="mb-2 flex justify-between text-okada">
        <span>TOP RIDERS</span>
        <span className="text-white/50">{isSupabaseConfigured ? 'GLOBAL' : 'LOCAL'}</span>
      </div>
      {rows.length === 0 && <div className="text-white/60">No scores yet. Be the first!</div>}
      <ol className="space-y-1">
        {rows.map((r, i) => (
          <li key={r.id ?? `${r.name}-${i}`} className="flex justify-between text-white">
            <span>{i + 1}. {r.name}</span>
            <span>{r.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
