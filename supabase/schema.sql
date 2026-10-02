-- Run this once in your Supabase SQL editor (Database → SQL editor → New query)

create table if not exists visits (
  visitor_id uuid primary key,
  name text,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  opens int not null default 1,
  done int not null default 0,
  start_date bigint
);

create table if not exists pins (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null,
  name text,
  url text not null check (url like 'https://%' and length(url) <= 400),
  note text check (length(note) <= 120),
  cheered boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists pins_created_idx on pins (created_at desc);
create index if not exists pins_visitor_idx on pins (visitor_id);

alter table visits enable row level security;
alter table pins enable row level security;
-- No public policies: only the server (service role key) can read or write.

-- Atomic upsert function so opens = opens + 1 is never lost under concurrency
create or replace function record_visit(
  p_visitor_id uuid,
  p_name text,
  p_done int,
  p_start_date bigint
) returns void language plpgsql security definer as $$
begin
  insert into visits (visitor_id, name, done, start_date, first_seen, last_seen, opens)
  values (p_visitor_id, p_name, p_done, p_start_date, now(), now(), 1)
  on conflict (visitor_id) do update set
    last_seen   = now(),
    opens       = visits.opens + 1,
    name        = p_name,
    done        = p_done,
    start_date  = coalesce(p_start_date, visits.start_date);
end;
$$;
