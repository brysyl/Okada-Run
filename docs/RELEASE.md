# Okada Run: Release notes

## 1. Bundle and performance audit (`npm run build`)

| Asset | Raw | Gzip |
| --- | --- | --- |
| `index.html` | 0.67 kB | 0.39 kB |
| `assets/index-*.css` | 9.70 kB | 2.77 kB |
| `assets/index-*.js` | 388.27 kB | 112.03 kB |

Findings:

- Type check and production build pass. Build time is about 1.3s, 95 modules, no sourcemaps shipped.
- The JS bundle is a single chunk. Most of it is React/ReactDOM plus `@supabase/supabase-js`. Total transfer is about 115 kB gzipped, which is fine for a game.
- Optional improvement: lazy-load the Supabase client with `import()` only when `VITE_SUPABASE_URL` is set. This would cut the initial JS for local-only players. Not done to keep the release low risk.
- The game has no image or audio files (sprites are drawn on canvas, sound is procedural Web Audio), so there is nothing else to compress.
- `index.html` loads the "Press Start 2P" font from Google Fonts with `preconnect`. If it is blocked, the browser falls back to a system font. Self-hosting is optional.
- Runtime: the game loop uses `requestAnimationFrame` with cleanup, and the simulation is a pure TS module covered by unit tests.

## 2. Deployment config review

Both configs build with `npm run build` and publish `dist`. Changes made:

- **Vercel (`vercel.json`)**: added `Cache-Control: public, max-age=31536000, immutable` for `/assets/*` (filenames are content-hashed) and the headers `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` and `X-Frame-Options: SAMEORIGIN` for all routes.
- **Netlify (`netlify.toml`)**: same cache and security headers, and `NODE_VERSION = "20"` pinned.
- No SPA rewrite is needed because the app is a single page with no client-side routes.
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host dashboard if you want the global leaderboard. Without them the game uses localStorage.

## 3. Smoke test

`e2e/smoke.spec.ts` (Playwright) builds and previews the app, then checks that the canvas is visible and sized, that Enter starts a run (HUD score appears), that arrow key input changes the canvas pixels, and that no page errors occur.

```bash
npm install
npx playwright install chromium   # one time
npm run test:e2e
```

It is separate from `npm test` (vitest only includes `src/**/*.test.ts`).

Result in the sandbox: 1 passed (Chromium headless shell). `npm test`: 22 passed.

## 4. Merge summary

Branch `feature/okada-run-game` into `main` (PR #1):

- A 3-lane arcade runner: Danfo buses, Keke Napeps, potholes, Naira, Iron Helmet and Agbero Nitro pickups.
- Custom canvas engine (`src/game-engine`), React HUD, menu and game over screens, keyboard and swipe input, procedural audio.
- Supabase realtime leaderboard with localStorage fallback, plus an idempotent migration.
- Vercel and Netlify configs, unit tests (22), and a Playwright smoke test.

## 5. Run locally

```bash
git fetch origin
git checkout feature/okada-run-game   # or main after merge
npm install
npm run dev                            # open http://localhost:5173
```

Production preview: `npm run build && npm run preview` (http://localhost:4173).

Controls: `A`/`D` or arrow keys to change lanes, `Enter`/`Space` to start, swipe on touch devices.
