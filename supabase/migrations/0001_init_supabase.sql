-- Tables your app expects
create table if not exists public.league_connection (
  user_id uuid not null,
  provider text not null,
  league_id text,
  access_token_enc text,
  refresh_token_enc text,
  expires_at timestamptz,
  inserted_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, provider, league_id)
);

create table if not exists public.league_snapshot (
  provider text not null,
  league_id text not null,
  week int not null,
  raw_json jsonb not null,
  inserted_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (provider, league_id, week)
);

create table if not exists public.episode (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  provider text not null,
  league_id text not null,
  week int not null,
  script_md text,
  audio_url text,
  duration_s int,
  status text default 'draft',
  inserted_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.league_connection enable row level security;
alter table public.league_snapshot  enable row level security;
alter table public.episode          enable row level security;

-- Public read of 'rendered' episodes only
drop policy if exists "public read rendered episodes" on public.episode;
create policy "public read rendered episodes"
on public.episode
for select
to anon, authenticated
using (status = 'rendered');
