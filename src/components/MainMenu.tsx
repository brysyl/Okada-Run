import { GlassPanel } from './GlassPanel';
import { Leaderboard } from './Leaderboard';

export function MainMenu({ onStart }: { onStart: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-4">
      <GlassPanel className="flex w-full max-w-xs flex-col items-center gap-4 p-6 text-center font-arcade text-white">
        <h1 className="text-2xl leading-tight text-okada">OKADA<br />RUN</h1>
        <p className="text-[9px] leading-relaxed text-white/80">
          Dodge danfos, keke and potholes. Grab naira, helmets and nitro!
        </p>
        <p className="text-[8px] text-white/60">Swipe or A / D / arrow keys to switch lanes</p>
        <button
          type="button"
          onClick={onStart}
          className="w-full rounded-xl bg-naija px-4 py-3 text-xs text-white shadow-lg transition active:scale-95"
        >
          START
        </button>
        <Leaderboard />
      </GlassPanel>
    </div>
  );
}
