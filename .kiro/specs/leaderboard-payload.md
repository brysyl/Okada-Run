# Leaderboard payload

Table `public.leaderboard` (see `supabase/migrations/001_leaderboard.sql`). Anonymous clients can only `select`; inserts are done by the `submit-score` edge function with the service role.

Request body (POST `submit-score`, via `supabase.functions.invoke`, max 2048 bytes):

```json
{ "name": "TUNDE", "score": 1240, "coins": 18, "distance": 530, "durationS": 42.1, "maxSpeed": 493.6, "nitroUses": 1 }
```

`score`, `coins`, `distance`, `nitroUses` are non-negative integers; `durationS` (game seconds, 1-3600) and `maxSpeed` are non-negative numbers. All metrics are client-reported. `id` and `created_at` are never accepted from the client.

Validation (`supabase/functions/submit-score/validate.ts`, pure TS, tested in `validate.test.ts`): name sanitised to `[\w \-.]`, 1-12 chars (default `RIDER`); maxSpeed within `speedAt(duration)` (x2 if nitroUses > 0); distance between the integral of `speedAt` and that plus Nitro extra; coins and nitroUses capped by wave spawn rate; score <= `0.1*5*distance + 10*5*coins` plus tolerance. Constants are duplicated from the engine and a test keeps them in sync.

Responses: `200 {ok:true}`, `400 {ok:false,reason}` (reasons: invalid_body, invalid_name, invalid_number, duration_out_of_range, max_speed_implausible, distance_too_low, distance_too_high, too_many_coins, too_many_nitro, score_too_high), `405`, `413`, `429 {reason:'rate_limited'}` (per salted-SHA-256 IP hash, `SCORE_RATE_LIMIT_PER_MINUTE`, default 5), `500`.

Row (`LeaderboardEntry`) adds `id` (uuid), `created_at`, and nullable `duration_s`, `max_speed`, `nitro_uses`. Table `public.score_submissions(ip_hash, created_at)` is the rate-limit log (service role only). Top scores are read with `order by score desc limit N`. Realtime INSERT events trigger a refetch.

Fallback: when `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing, or the function call errors or rejects, entries (name/score/coins/distance only) are stored in `localStorage` key `okada-run:leaderboard:v1` (top 100).

Limits: metrics are client-reported, so this only raises the cost of cheating; forged self-consistent payloads can pass.
