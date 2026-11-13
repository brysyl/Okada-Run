create table if not exists public.leaderboard (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 12),
  score integer not null check (score >= 0 and score <= 10000000),
  coins integer not null default 0 check (coins >= 0),
  distance integer not null default 0 check (distance >= 0),
  created_at timestamptz not null default now()
);

create index if not exists leaderboard_score_idx on public.leaderboard (score desc);

alter table public.leaderboard enable row level security;

-- Writes go through the submit-score edge function (service role), which checks the
-- client-reported run metrics against what the game engine can produce and rate limits
-- per IP. Metrics are still client-reported, so this raises the cost of cheating but does
-- not make forged scores impossible. Anonymous clients can only read.
drop policy if exists "leaderboard readable by everyone" on public.leaderboard;
create policy "leaderboard readable by everyone" on public.leaderboard
  for select using (true);
-- Safe for databases that already ran the older version with open inserts.
drop policy if exists "leaderboard insertable by everyone" on public.leaderboard;
revoke insert, update, delete on public.leaderboard from anon, authenticated;

-- Run metrics stored by the edge function (nullable: rows from the old version have none).
alter table public.leaderboard add column if not exists duration_s numeric;
alter table public.leaderboard add column if not exists max_speed numeric;
alter table public.leaderboard add column if not exists nitro_uses integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leaderboard_duration_s_check') then
    alter table public.leaderboard add constraint leaderboard_duration_s_check
      check (duration_s is null or (duration_s >= 0 and duration_s <= 3600));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'leaderboard_max_speed_check') then
    alter table public.leaderboard add constraint leaderboard_max_speed_check
      check (max_speed is null or (max_speed >= 0 and max_speed <= 1300));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'leaderboard_nitro_uses_check') then
    alter table public.leaderboard add constraint leaderboard_nitro_uses_check
      check (nitro_uses is null or nitro_uses >= 0);
  end if;
end $$;

-- Per-IP rate limit log. Only hashed IPs are stored. Service role only: RLS on, no policies.
create table if not exists public.score_submissions (
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists score_submissions_ip_idx on public.score_submissions (ip_hash, created_at desc);
alter table public.score_submissions enable row level security;
revoke all on public.score_submissions from anon, authenticated;

-- Enable realtime updates for the live leaderboard (idempotent).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'leaderboard'
  ) then
    alter publication supabase_realtime add table public.leaderboard;
  end if;
end $$;
