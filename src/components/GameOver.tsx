import { useState, type FormEvent } from 'react';
import type { RunResult } from '../hooks/useOkadaGame';
import { submitScore } from '../supabase/leaderboard';
import { GlassPanel } from './GlassPanel';
import { Leaderboard } from './Leaderboard';

const NAME_KEY = 'okada-run:name';

export function GameOver({ result, onRestart, onMenu }: { result: RunResult; onRestart: () => void; onMenu: () => void }) {
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? '');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || saved) return;
    setBusy(true);
    localStorage.setItem(NAME_KEY, name);
    try {
      await submitScore({ name: name || 'RIDER', ...result });
      setSaved(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4">
      <GlassPanel className="flex w-full max-w-xs flex-col items-center gap-3 p-6 text-center font-arcade text-white">
        <h2 className="text-xl text-red-400">GAME OVER</h2>
        <div className="text-sm text-okada">{result.score}</div>
        <div className="text-[9px] text-white/70">{'\u20A6'} {result.coins} &middot; {result.distance} m</div>
        <form onSubmit={submit} className="flex w-full gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
            placeholder="YOUR NAME"
            aria-label="Your name"
            disabled={saved}
            className="min-w-0 flex-1 rounded-lg border border-white/20 bg-black/30 px-2 py-2 text-[10px] text-white outline-none"
          />
          <button type="submit" disabled={saved || busy} className="rounded-lg bg-okada px-3 py-2 text-[10px] text-black disabled:opacity-50">
            {saved ? 'SAVED' : 'SAVE'}
          </button>
        </form>
        <button type="button" onClick={onRestart} className="w-full rounded-xl bg-naija px-4 py-3 text-xs shadow-lg active:scale-95">
          RIDE AGAIN
        </button>
        <button type="button" onClick={onMenu} className="text-[9px] text-white/60 underline">MENU</button>
        <Leaderboard limit={5} />
      </GlassPanel>
    </div>
  );
}
