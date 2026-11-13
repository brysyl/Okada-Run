# Leaderboard payload

Table `public.leaderboard` (see `supabase/migrations/001_leaderboard.sql`).

Insert payload (`NewScore`):

```json
{ "name": "TUNDE", "score": 1240, "coins": 18, "distance": 530 }
```

Row (`LeaderboardEntry`) adds `id` (uuid) and `created_at` (ISO timestamp).

Rules: name 1-12 chars (sanitised client-side to `[\w \-.]`, default `RIDER`), integers >= 0. Top scores are read with `order by score desc limit N`. Realtime INSERT events trigger a refetch.

Fallback: when `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing, or an insert fails, entries are stored in `localStorage` key `okada-run:leaderboard:v1` (top 100).
