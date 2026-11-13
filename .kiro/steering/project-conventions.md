# Okada Run steering

- Stack: Vite, React 18, strict TypeScript, Tailwind, Canvas 2D, Web Audio, optional Supabase.
- `src/game-engine` is pure TypeScript: no React, no DOM except `renderer.ts`. Keep logic testable with vitest (`npm test`).
- Randomness goes through `rng.ts` (seeded) so tests stay deterministic.
- Every rAF loop, listener and AudioContext must be cleaned up on unmount (see `useGameLoop`, `useKeyboard`, `useSwipe`).
- Do not push per-frame state into React; use the ref and the throttled HUD snapshot.
- Audio is procedural only. Do not add audio asset files.
- Leaderboard must work with no env vars (localStorage fallback).
- Update `.kiro/specs/*` when changing state shape, hitboxes or the leaderboard payload.
- Verify with: `npx tsc --noEmit && npm test && npm run build`.
