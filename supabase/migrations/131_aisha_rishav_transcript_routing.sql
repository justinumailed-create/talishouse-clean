-- Route new Aisha call transcripts to associate Rishav and create Contact CRM
-- prospects. Additive only: no drops, no existing lead or agent data rewritten
-- except widening allowed privilege / position / country checks.

-- 1) Grantable associate privilege for the Aisha transcript queue.
alter table public.agent_admins drop constraint if exists agent_admins_privileges_check;
alter table public.agent_admins add constraint agent_admins_privileges_check check (
  privileges <@ array[
    'mapsites', 'ebooks', 'pins', 'cash-payments',
    'talisbooks', 'build-requests', 'leads', 'agent-pages',
    'leads-crm', 'aisha-transcripts'
  ]::text[]
);

-- 2) CRM: Aisha conversation id for dedup, and a Prospect position for callers
--    who are not (yet) a known broker / team leader. Country may be unknown
--    until the associate fills it in.
alter table public.brokerage_leads
  add column if not exists source_conversation_id text;

comment on column public.brokerage_leads.source_conversation_id is
  'ElevenLabs conversation id when the contact was created from an Aisha Call. Unique so webhook retries never insert twice.';

create unique index if not exists brokerage_leads_source_conversation_id_key
  on public.brokerage_leads (source_conversation_id)
  where source_conversation_id is not null;

alter table public.brokerage_leads drop constraint if exists brokerage_leads_position_check;
alter table public.brokerage_leads add constraint brokerage_leads_position_check check (
  position in ('broker', 'acting_broker', 'managing_broker', 'team_leader', 'prospect')
);

alter table public.brokerage_leads alter column country drop not null;
alter table public.brokerage_leads drop constraint if exists brokerage_leads_country_check;
alter table public.brokerage_leads add constraint brokerage_leads_country_check check (
  country is null or country in ('Canada', 'USA')
);

-- 3) Persisted, assigned Aisha transcripts (Rishav's queue). Service role only.
create table if not exists public.aisha_routed_transcripts (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null,
  started_at timestamptz,
  duration_secs integer,
  status text,
  caller_name text,
  caller_phone text,
  caller_email text,
  market text,
  fast_code text,
  is_registered boolean,
  title text,
  summary text,
  fields jsonb not null default '{}'::jsonb,
  transcript jsonb not null default '[]'::jsonb,
  assigned_agent_id uuid references public.agent_admins(id) on delete set null,
  brokerage_lead_id uuid references public.brokerage_leads(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint aisha_routed_transcripts_conversation_id_key unique (conversation_id)
);

create index if not exists aisha_routed_transcripts_assigned_idx
  on public.aisha_routed_transcripts (assigned_agent_id, started_at desc);
create index if not exists aisha_routed_transcripts_lead_idx
  on public.aisha_routed_transcripts (brokerage_lead_id);

comment on table public.aisha_routed_transcripts is
  'New ended Aisha calls with human speech, assigned to an associate (Rishav). Historical calls before the 2026-11-26 17:00 IST cutoff are never inserted. Service-role (Next.js) access only.';

alter table public.aisha_routed_transcripts enable row level security;

revoke all on table public.aisha_routed_transcripts from public, anon, authenticated, service_role;
grant select, insert, update on table public.aisha_routed_transcripts to service_role;

drop policy if exists aisha_routed_transcripts_no_api on public.aisha_routed_transcripts;
create policy aisha_routed_transcripts_no_api on public.aisha_routed_transcripts
  for all to anon, authenticated
  using (false)
  with check (false);
