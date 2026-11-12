create table if not exists workspace (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
