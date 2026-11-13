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

create policy "leaderboard readable by everyone" on public.leaderboard
  for select using (true);
create policy "leaderboard insertable by everyone" on public.leaderboard
  for insert with check (true);

-- Enable realtime updates for the live leaderboard.
alter publication supabase_realtime add table public.leaderboard;
