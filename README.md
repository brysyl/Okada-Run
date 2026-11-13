# Okada Run

A 3-lane arcade runner set on Nigerian roads. Ride an okada, dodge Danfo buses, erratic Keke Napeps and potholes, and collect Naira notes, Iron Helmets and Agbero Nitro boosts.

Built with Vite, React 18, TypeScript (strict), Tailwind CSS, HTML5 Canvas, Web Audio (procedural sounds, no audio files) and an optional Supabase leaderboard.

## Controls

| Input | Action |
| --- | --- |
| `A` / `Left Arrow` | Move left |
| `D` / `Right Arrow` | Move right |
| `Enter` / `Space` | Start (menu) |
| Swipe left / right | Move lane (touch) |

## Gameplay

- **Danfo bus**: spans two lanes. Hitting it ends the run.
- **Keke Napep**: weaves between lanes. Hitting it ends the run.
- **Pothole**: costs one of 3 lives (brief invulnerability after a hit). Ignored while the Iron Helmet shield is active.
- **Naira note**: score and coins. Every 5 coins raises the multiplier (max x5).
- **Iron Helmet**: 8s shield against potholes.
- **Agbero Nitro**: 3s turbo surge at double speed that clears all obstacles.
- Speed ramps up over time. Screen shake on impacts, particle bursts on pickups.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine + leaderboard unit tests
npm run build      # type check + production build into dist/
npm run preview
npm run test:e2e   # Playwright e2e suite (run `npx playwright install chromium` once)
```

The e2e suite (`e2e/okada-run.spec.ts`) checks that the page loads with no console errors, that START moves from the menu to the running game, and that A/D, arrow keys and touch swipes switch lanes. To check the lane, the tests read a read-only `data-lane` attribute on the game canvas (`0` = left, `1` = middle, `2` = right). The game loop writes the engine's target lane to it every frame, and nothing in the app reads it back.

See [docs/RELEASE.md](docs/RELEASE.md) for the bundle audit, deploy review and merge summary.

## Leaderboard (Supabase, optional)

Without configuration the game stores scores in `localStorage` (labelled LOCAL). To enable a global realtime leaderboard:

1. Create a Supabase project and run `supabase/migrations/001_leaderboard.sql` in the SQL editor.
2. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Restart the dev server. If a Supabase request fails, scores fall back to localStorage.

Note: the anon insert policy is open by design for a casual game. Add rate limiting or an edge function if you need anti-cheat.

## Deploy

- **Vercel**: import the repo. `vercel.json` sets the build command and `dist` output. Add the two `VITE_SUPABASE_*` env vars (optional).
- **Netlify**: `netlify.toml` configures `npm run build` and publishes `dist`.
- **Any static host**: run `npm run build` and serve `dist/`.

## Project structure

```
src/
  game-engine/   pure TS simulation (types, constants, lanes, spawner, collision, update) + canvas renderer + tests
  hooks/         useGameLoop (rAF with cleanup), useKeyboard, useSwipe, useOkadaGame
  audio/         procedural Web Audio engine
  components/    glassmorphism HUD, menu, game over, leaderboard
  supabase/      client, leaderboard API, localStorage fallback
supabase/migrations/   SQL schema
.kiro/specs/           game state, collision boxes, leaderboard payload docs
.kiro/steering/        project conventions
```

## License

See [LICENSE](LICENSE).
