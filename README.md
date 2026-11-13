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
npm run test:e2e   # Playwright smoke test (run `npx playwright install chromium` once)
```

See [docs/RELEASE.md](docs/RELEASE.md) for the bundle audit, deploy review and merge summary.

## Leaderboard (Supabase, optional)

Without configuration the game stores scores in `localStorage` (labelled LOCAL). To enable a global realtime leaderboard:

1. Create a Supabase project and apply `supabase/migrations/001_leaderboard.sql` (`supabase db push` or the SQL editor). It is idempotent and removes anonymous inserts from databases that ran the older version.
2. Set the function secrets: `supabase secrets set IP_HASH_SALT=<random> SCORE_RATE_LIMIT_PER_MINUTE=5 ALLOWED_ORIGIN=https://your-site.example` (see `.env.example`).
3. Deploy the function: `supabase functions deploy submit-score`.
4. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Restart the dev server. If the function call fails or rejects a score, it falls back to localStorage.

Scores are submitted to the `submit-score` edge function, which validates them and inserts with the service role. The table is read-only for the anon key.

### Residual risk

- The run metrics (duration, max speed, Nitro pickups) are reported by the client. The function checks that score, distance and coins are consistent with those metrics and with the engine's rules, which raises the cost of cheating, but an attacker who forges self-consistent metrics can still post a plausible, inflated score.
- There is no replay or input verification, so a bot or modified client playing well is indistinguishable from a real player.
- Rate limiting is per hashed IP (`x-forwarded-for`); shared IPs may be throttled and attackers can rotate IPs.
- The engine constants are duplicated in `supabase/functions/submit-score/validate.ts`; a vitest checks they stay in sync.
- The edge function `index.ts` (Deno) is not covered by the unit tests; only `validate.ts` is.

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
