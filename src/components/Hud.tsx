import type { Hud as HudData } from '../hooks/useOkadaGame';
import { GlassPanel } from './GlassPanel';

export function Hud({ hud, muted, onMute }: { hud: HudData; muted: boolean; onMute: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2 p-2 font-arcade text-[10px] text-white">
      <div className="flex items-start justify-between gap-2">
        <GlassPanel className="px-3 py-2">
          <div className="text-okada">SCORE</div>
          <div className="mt-1 text-sm" data-testid="score">{hud.score}</div>
        </GlassPanel>
        <GlassPanel className="px-3 py-2 text-right">
          <div>{'\u20A6'} {hud.coins} <span className="text-okada">x{hud.multiplier}</span></div>
          <div className="mt-1 text-red-400" aria-label={`${hud.lives} lives`}>
            {'\u2665'.repeat(Math.max(0, hud.lives))}
          </div>
        </GlassPanel>
        <button
          type="button"
          onClick={onMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="pointer-events-auto rounded-full border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-md"
        >
          {muted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}
        </button>
      </div>
      <div className="flex gap-2">
        {hud.shield > 0 && <GlassPanel className="px-2 py-1 text-sky-300">HELMET {hud.shield.toFixed(1)}s</GlassPanel>}
        {hud.nitro > 0 && <GlassPanel className="px-2 py-1 text-orange-300">NITRO {hud.nitro.toFixed(1)}s</GlassPanel>}
      </div>
    </div>
  );
}
