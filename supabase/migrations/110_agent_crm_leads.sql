-- Agent brokerage CRM (Leads). Additive only: does not alter public.leads
-- (website contact leads) and does not drop data.
--
-- Access model: agents sign in with the app session, not Supabase Auth, so
-- row ownership cannot be expressed with auth.uid(). Tables stay in public
-- with RLS on and no usable Data API grants. The Next.js server (service role)
-- is the only writer, after it checks the agent session and the leads-crm
-- privilege. Direct DELETE is rejected by a trigger even for service_role;
-- the only delete path is public.superadmin_delete_brokerage_lead, which
-- anon/authenticated cannot execute. The server calls that function only for
-- the Global Admin.

alter table public.agent_admins drop constraint if exists agent_admins_privileges_check;
alter table public.agent_admins add constraint agent_admins_privileges_check check (
  privileges <@ array[
    'mapsites', 'ebooks', 'pins', 'cash-payments',
    'talisbooks', 'build-requests', 'leads', 'agent-pages',
    'leads-crm'
  ]::text[]
);

-- Existing agents prospect brokerages today; turn the CRM privilege on for them.
update public.agent_admins
set privileges = privileges || array['leads-crm']::text[]
where not (privileges @> array['leads-crm']::text[]);

create table if not exists public.brokerage_leads (
  id uuid primary key default gen_random_uuid(),
  decision_maker_name text not null,
  position text not null,
  cell_phone text,
  cell_phone_digits text,
  email text,
  email_normalized text,
  brokerage_name text not null,
  brokerage_website text,
  brokerage_address text,
  office_phone text,
  office_phone_digits text,
  latitude double precision,
  longitude double precision,
  country text not null,
  market text,
  status text not null default 'new',
  notes text,
  match_name text,
  created_by_agent_id uuid references public.agent_admins(id) on delete set null,
  created_by_name text not null,
  updated_by_agent_id uuid references public.agent_admins(id) on delete set null,
  updated_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brokerage_leads_position_check check (
    position in ('broker', 'acting_broker', 'managing_broker', 'team_leader')
  ),
  constraint brokerage_leads_country_check check (country in ('Canada', 'USA')),
  constraint brokerage_leads_status_check check (
    status in ('new', 'contacted', 'replied', 'registered', 'not_interested')
  ),
  constraint brokerage_leads_name_check check (
    char_length(btrim(decision_maker_name)) > 0
    and char_length(decision_maker_name) <= 200
    and char_length(btrim(brokerage_name)) > 0
    and char_length(brokerage_name) <= 200
  ),
  constraint brokerage_leads_lat_lng_check check (
    (latitude is null and longitude is null)
    or (
      latitude between -90 and 90
      and longitude between -180 and 180
    )
  )
);

create index if not exists brokerage_leads_created_by_idx
  on public.brokerage_leads (created_by_agent_id, created_at desc);
create index if not exists brokerage_leads_status_idx on public.brokerage_leads (status);
create index if not exists brokerage_leads_country_idx on public.brokerage_leads (country);
create index if not exists brokerage_leads_market_idx on public.brokerage_leads (market);
create index if not exists brokerage_leads_email_idx on public.brokerage_leads (email_normalized);
create index if not exists brokerage_leads_cell_idx on public.brokerage_leads (cell_phone_digits);
create index if not exists brokerage_leads_office_idx on public.brokerage_leads (office_phone_digits);
create index if not exists brokerage_leads_match_name_idx on public.brokerage_leads (match_name);
create index if not exists brokerage_leads_created_at_idx on public.brokerage_leads (created_at desc);

comment on table public.brokerage_leads is
  'Agent CRM contacts for independent brokerages. Agents insert and update their own rows via the server. They cannot delete. Only the Global Admin can delete, through superadmin_delete_brokerage_lead.';

create table if not exists public.brokerage_lead_edits (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.brokerage_leads(id) on delete cascade,
  action text not null,
  actor_agent_id uuid references public.agent_admins(id) on delete set null,
  actor_name text not null,
  actor_role text not null,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint brokerage_lead_edits_action_check check (action in ('create', 'update', 'import')),
  constraint brokerage_lead_edits_role_check check (actor_role in ('agent', 'superadmin'))
);

create index if not exists brokerage_lead_edits_lead_idx
  on public.brokerage_lead_edits (lead_id, created_at desc);

comment on table public.brokerage_lead_edits is
  'Append-only edit history for a brokerage lead. Removed with the lead when a superadmin deletes it; the activity log keeps the delete.';

-- Same key the CSV importer uses: digits only, drop a leading NANP 1, ignore fragments.
create or replace function public.brokerage_lead_phone_key(raw text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when digits ~ '^1[0-9]{10}$' then substr(digits, 2)
    when char_length(digits) >= 7 then digits
    else null
  end
  from (select regexp_replace(coalesce(raw, ''), '\D', '', 'g') as digits) s;
$$;

-- Normalize match keys and updated_at in the database so imports cannot skip them.
create or replace function public.brokerage_leads_before_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.decision_maker_name := btrim(new.decision_maker_name);
  new.brokerage_name := btrim(new.brokerage_name);
  new.cell_phone_digits := public.brokerage_lead_phone_key(new.cell_phone);
  new.office_phone_digits := public.brokerage_lead_phone_key(new.office_phone);
  new.email_normalized := nullif(lower(btrim(coalesce(new.email, ''))), '');
  new.match_name := nullif(
    lower(btrim(coalesce(new.brokerage_name, ''))) || '|' || lower(btrim(coalesce(new.decision_maker_name, ''))),
    '|'
  );
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
    new.created_by_agent_id := old.created_by_agent_id;
    new.created_by_name := old.created_by_name;
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists brokerage_leads_before_write on public.brokerage_leads;
create trigger brokerage_leads_before_write
  before insert or update on public.brokerage_leads
  for each row execute function public.brokerage_leads_before_write();

-- Agents cannot delete leads. service_role bypasses RLS, so a trigger is the
-- enforcement: every DELETE fails unless this transaction set the flag, and
-- only superadmin_delete_brokerage_lead sets it.
create or replace function public.brokerage_leads_block_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(current_setting('app.brokerage_lead_delete', true), '') is distinct from 'superadmin' then
    raise exception 'Agents cannot delete brokerage leads'
      using errcode = '42501';
  end if;
  return old;
end;
$$;

drop trigger if exists brokerage_leads_no_agent_delete on public.brokerage_leads;
create trigger brokerage_leads_no_agent_delete
  before delete on public.brokerage_leads
  for each row execute function public.brokerage_leads_block_delete();

create or replace function public.brokerage_leads_block_truncate()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Agents cannot delete brokerage leads'
    using errcode = '42501';
end;
$$;

drop trigger if exists brokerage_leads_no_truncate on public.brokerage_leads;
create trigger brokerage_leads_no_truncate
  before truncate on public.brokerage_leads
  for each statement execute function public.brokerage_leads_block_truncate();

-- Lives in public so the service-role server client can call it. EXECUTE is
-- revoked from anon, authenticated and PUBLIC (Postgres grants EXECUTE to
-- PUBLIC by default). The function does not accept a role argument.
create or replace function public.superadmin_delete_brokerage_lead(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_id is null then
    raise exception 'Lead id is required' using errcode = '22023';
  end if;
  perform set_config('app.brokerage_lead_delete', 'superadmin', true);
  delete from public.brokerage_leads where id = p_id;
end;
$$;

revoke all on function public.superadmin_delete_brokerage_lead(uuid) from public, anon, authenticated;
grant execute on function public.superadmin_delete_brokerage_lead(uuid) to service_role;

alter table public.brokerage_leads enable row level security;
alter table public.brokerage_lead_edits enable row level security;

revoke all on table public.brokerage_leads from public, anon, authenticated, service_role;
revoke all on table public.brokerage_lead_edits from public, anon, authenticated, service_role;

-- Server writes only. No DELETE grant: the trigger plus the revoked grant
-- both reject agent (and accidental service-role) deletes.
grant select, insert, update on table public.brokerage_leads to service_role;
grant select, insert on table public.brokerage_lead_edits to service_role;

drop policy if exists brokerage_leads_no_api on public.brokerage_leads;
create policy brokerage_leads_no_api on public.brokerage_leads
  for all to anon, authenticated
  using (false)
  with check (false);

drop policy if exists brokerage_lead_edits_no_api on public.brokerage_lead_edits;
create policy brokerage_lead_edits_no_api on public.brokerage_lead_edits
  for all to anon, authenticated
  using (false)
  with check (false);

revoke all on function public.brokerage_lead_phone_key(text) from public, anon, authenticated;
revoke all on function public.brokerage_leads_before_write() from public, anon, authenticated;
revoke all on function public.brokerage_leads_block_delete() from public, anon, authenticated;
revoke all on function public.brokerage_leads_block_truncate() from public, anon, authenticated;
grant execute on function public.brokerage_lead_phone_key(text) to service_role;
grant execute on function public.brokerage_leads_before_write() to service_role;
grant execute on function public.brokerage_leads_block_delete() to service_role;
grant execute on function public.brokerage_leads_block_truncate() to service_role;
