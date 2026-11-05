-- Agent call flow (Nov 5).
-- Links brokerage CRM rows to prospect FAST Codes, stores the locked
-- step responses, and opens review checkpoints.
-- Agent Arun is a reviewer on agent_admins: view and comment only.
-- He is not an admin. No password is stored here.
-- Does not alter contract signatures, payments, or customer accounts.

alter table public.agent_admins
  add column if not exists reviewer boolean not null default false;

comment on column public.agent_admins.reviewer is
  'Reviewer (Agent Arun): may view every prospect lead and comment at checkpoints. Not an admin and holds no admin scopes.';

-- Chat is an on-demand feature. Do not open it when an agent signs in.
alter table public.agent_admins alter column chat_on_login set default false;
update public.agent_admins set chat_on_login = false where chat_on_login is distinct from false;

insert into public.agent_admins (
  name, login_id, must_change_password, status, privileges, reviewer, created_by
)
select 'Agent Arun', 'arun', true, 'active', '{}'::text[], true, 'migration-116'
where not exists (select 1 from public.agent_admins where login_id = 'arun');

update public.agent_admins
set reviewer = true,
    name = 'Agent Arun',
    must_change_password = case when password_hash is null then true else must_change_password end,
    updated_at = now()
where login_id = 'arun';

alter table public.brokerage_leads
  add column if not exists fast_code text,
  add column if not exists mapsite_id uuid,
  add column if not exists agent_count integer,
  add column if not exists source text,
  add column if not exists town text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'brokerage_leads_mapsite_id_fkey') then
    alter table public.brokerage_leads
      add constraint brokerage_leads_mapsite_id_fkey
      foreign key (mapsite_id) references public.mapsites(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'brokerage_leads_agent_count_check') then
    alter table public.brokerage_leads
      add constraint brokerage_leads_agent_count_check
      check (agent_count is null or agent_count between 0 and 5000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'brokerage_leads_source_len') then
    alter table public.brokerage_leads
      add constraint brokerage_leads_source_len
      check (source is null or char_length(source) between 1 and 300);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'brokerage_leads_town_len') then
    alter table public.brokerage_leads
      add constraint brokerage_leads_town_len
      check (town is null or char_length(town) between 1 and 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'brokerage_leads_fast_code_len') then
    alter table public.brokerage_leads
      add constraint brokerage_leads_fast_code_len
      check (fast_code is null or fast_code = lower(fast_code));
  end if;
end $$;

create unique index if not exists brokerage_leads_fast_code_key
  on public.brokerage_leads (fast_code) where fast_code is not null;

create table if not exists public.fast_code_step_responses (
  id uuid primary key default gen_random_uuid(),
  fast_code text not null,
  step_key text not null,
  response text not null,
  outcome text not null default 'continue',
  agent_id uuid references public.agent_admins(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint fast_code_step_responses_code_step unique (fast_code, step_key),
  constraint fast_code_step_responses_step_check check (
    step_key in ('opener', 'hook', 'how', 'walkthrough', 'value', 'time', 'register')
  ),
  constraint fast_code_step_responses_outcome_check check (outcome in ('continue', 'not_interested')),
  constraint fast_code_step_responses_response_len check (char_length(btrim(response)) between 1 and 4000),
  constraint fast_code_step_responses_code_check check (fast_code = lower(fast_code))
);

create index if not exists fast_code_step_responses_agent_idx
  on public.fast_code_step_responses (agent_id, created_at desc);

create table if not exists public.fast_code_checkpoints (
  fast_code text not null,
  checkpoint_key text not null,
  opened_at timestamptz not null default now(),
  primary key (fast_code, checkpoint_key),
  constraint fast_code_checkpoints_key_check check (
    checkpoint_key in ('after_first_contact', 'after_demo', 'before_registration')
  ),
  constraint fast_code_checkpoints_code_check check (fast_code = lower(fast_code))
);

create table if not exists public.fast_code_checkpoint_comments (
  id uuid primary key default gen_random_uuid(),
  fast_code text not null,
  checkpoint_key text not null,
  author_agent_id uuid references public.agent_admins(id) on delete set null,
  author_name text not null,
  author_role text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint fast_code_checkpoint_comments_role_check check (author_role in ('admin', 'reviewer')),
  constraint fast_code_checkpoint_comments_body_len check (char_length(btrim(body)) between 1 and 2000),
  constraint fast_code_checkpoint_comments_key_check check (
    checkpoint_key in ('after_first_contact', 'after_demo', 'before_registration')
  ),
  constraint fast_code_checkpoint_comments_code_check check (fast_code = lower(fast_code))
);

create index if not exists fast_code_checkpoint_comments_code_idx
  on public.fast_code_checkpoint_comments (fast_code, created_at);

-- History event types for the call flow. Existing rows stay valid.
do $$
declare cname text;
begin
  select c.conname into cname
  from pg_constraint c
  where c.conrelid = 'public.fast_code_updates'::regclass
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%event_type%';
  if cname is not null then
    execute format('alter table public.fast_code_updates drop constraint %I', cname);
  end if;
end $$;

alter table public.fast_code_updates
  add constraint fast_code_updates_event_type_check
  check (event_type in (
    'stage', 'note', 'listings', 'ebook', 'assigned', 'sourced', 'refresh',
    'step', 'comment', 'lead'
  ));

-- Call history is append-only. Lead rows keep the existing no-delete trigger.
create or replace function public.fast_code_flow_block_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Call flow history cannot be deleted' using errcode = '42501';
end;
$$;

drop trigger if exists fast_code_step_responses_no_delete on public.fast_code_step_responses;
create trigger fast_code_step_responses_no_delete
  before delete on public.fast_code_step_responses
  for each row execute function public.fast_code_flow_block_delete();

drop trigger if exists fast_code_checkpoints_no_delete on public.fast_code_checkpoints;
create trigger fast_code_checkpoints_no_delete
  before delete on public.fast_code_checkpoints
  for each row execute function public.fast_code_flow_block_delete();

drop trigger if exists fast_code_checkpoint_comments_no_delete on public.fast_code_checkpoint_comments;
create trigger fast_code_checkpoint_comments_no_delete
  before delete on public.fast_code_checkpoint_comments
  for each row execute function public.fast_code_flow_block_delete();

alter table public.fast_code_step_responses enable row level security;
alter table public.fast_code_checkpoints enable row level security;
alter table public.fast_code_checkpoint_comments enable row level security;

revoke all on table public.fast_code_step_responses from anon, authenticated;
revoke all on table public.fast_code_checkpoints from anon, authenticated;
revoke all on table public.fast_code_checkpoint_comments from anon, authenticated;

revoke all on function public.fast_code_flow_block_delete() from public, anon, authenticated;
