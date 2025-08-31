-- Users & connections
create table if not exists app_user(
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);
create table if not exists league_connection(
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_user(id) on delete cascade,
  provider text check (provider in ('sleeper','yahoo')) not null,
  access_token_enc text not null,
  refresh_token_enc text,
  expires_at timestamptz,
  league_id text not null,
  team_id text,
  created_at timestamptz default now()
);
create index on league_connection(user_id);

-- Weekly snapshots
create table if not exists league_snapshot(
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  league_id text not null,
  week int not null,
  raw_json jsonb not null,
  created_at timestamptz default now(),
  unique(provider, league_id, week)
);

-- Episodes
create table if not exists episode(
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_user(id) on delete cascade,
  provider text not null,
  league_id text not null,
  week int not null,
  script_md text,
  audio_url text,
  duration_s int,
  status text check (status in ('draft','rendered','failed')) default 'draft',
  created_at timestamptz default now(),
  unique(provider, league_id, week)
);

-- Metrics (simple event log)
create table if not exists metrics_event(
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  type text not null,
  payload jsonb,
  created_at timestamptz default now()
);
