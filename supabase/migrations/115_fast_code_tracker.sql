-- FAST Code tracker (Ralf, Nov 5): conversation stage per prospect code,
-- dated history, agent password gate attempts, daily job runs and a
-- sourcing review queue. Server-only (RLS on, no client policies).

create table if not exists public.fast_code_status (
  fast_code text primary key,
  mapsite_id uuid references public.mapsites(id) on delete set null,
  agent_id uuid references public.agent_admins(id) on delete set null,
  stage text not null default 'new'
    check (stage in ('new','contacted','in_conversation','demo_shown','follow_up','won','not_interested')),
  listings_count integer,
  last_refreshed_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.fast_code_updates (
  id uuid primary key default gen_random_uuid(),
  fast_code text not null,
  mapsite_id uuid references public.mapsites(id) on delete set null,
  agent_id uuid references public.agent_admins(id) on delete set null,
  event_type text not null
    check (event_type in ('stage','note','listings','ebook','assigned','sourced','refresh')),
  stage text,
  note text,
  details jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now()
);
create index if not exists fast_code_updates_code_idx on public.fast_code_updates (fast_code, created_at desc);
create index if not exists fast_code_updates_created_idx on public.fast_code_updates (created_at desc);

create table if not exists public.fast_code_gate_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  ok boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists fast_code_gate_attempts_ip_idx on public.fast_code_gate_attempts (ip_hash, created_at desc);

create table if not exists public.fast_code_job_runs (
  id uuid primary key default gen_random_uuid(),
  triggered_by text not null default 'cron',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  summary jsonb not null default '{}'::jsonb
);

create table if not exists public.prospect_queue (
  id uuid primary key default gen_random_uuid(),
  brokerage text not null,
  contact_name text,
  office_address text,
  town text,
  province text,
  website text,
  source_url text not null,
  research_notes text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  proposed_code text,
  assigned_agent_id uuid references public.agent_admins(id) on delete set null,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.fast_code_status enable row level security;
alter table public.fast_code_updates enable row level security;
alter table public.fast_code_gate_attempts enable row level security;
alter table public.fast_code_job_runs enable row level security;
alter table public.prospect_queue enable row level security;

-- Seed: every prepared slot code starts at "new" with its agent.
insert into public.fast_code_status (fast_code, mapsite_id, agent_id, stage)
select lower(m.fast_code), m.id, s.agent_id, 'new'
from public.agent_fast_code_slots s join public.mapsites m on m.id = s.mapsite_id
where m.fast_code is not null
on conflict (fast_code) do nothing;

insert into public.fast_code_updates (fast_code, mapsite_id, agent_id, event_type, stage, note, created_by, created_at)
select lower(m.fast_code), m.id, s.agent_id, 'assigned', 'new', null, 'system', s.created_at
from public.agent_fast_code_slots s join public.mapsites m on m.id = s.mapsite_id
where m.fast_code is not null
  and not exists (select 1 from public.fast_code_updates u where u.fast_code = lower(m.fast_code) and u.event_type = 'assigned');

-- Daily refresh snapshot.
alter table public.fast_code_status
  add column if not exists listings_snapshot jsonb,
  add column if not exists broker_site_status integer,
  add column if not exists listings_source_status text;
