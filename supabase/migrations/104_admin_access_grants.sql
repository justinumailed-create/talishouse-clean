-- 104: Admin access grants. There is ONE Global Admin (FAST Code ARUN, in code).
-- The Global Admin grants admin access to other FAST Codes with granular
-- permissions. Grants are revocable (revoked_at) and every change is logged in
-- admin_access_grant_events. Server code only (service role): RLS on, no
-- client policies. The retired ADMIN123 code is never granted (check below);
-- existing audit rows that mention it are untouched.

create table if not exists public.admin_access_grants (
  id uuid primary key default gen_random_uuid(),
  fast_code text not null check (fast_code = upper(btrim(fast_code)) and fast_code <> ''),
  display_name text,
  email text,
  permissions text[] not null default '{}',
  granted_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by text,
  constraint admin_access_grants_not_global check (fast_code not in ('ARUN', 'ADMIN123')),
  constraint admin_access_grants_permissions check (
    permissions <@ array[
      'build-requests','registrations','marketing','leads','mapsites','partner-linking',
      'seo','bookshelves','pmc-pins','fast-codes','agents','payments'
    ]::text[]
  )
);

-- One active grant per FAST Code (revoked rows stay as history).
create unique index if not exists admin_access_grants_active_code
  on public.admin_access_grants (fast_code) where revoked_at is null;

create table if not exists public.admin_access_grant_events (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid references public.admin_access_grants(id) on delete set null,
  fast_code text not null,
  action text not null check (action in ('granted', 'updated', 'revoked')),
  permissions text[] not null default '{}',
  actor text not null,
  created_at timestamptz not null default now()
);
create index if not exists admin_access_grant_events_code_idx
  on public.admin_access_grant_events (fast_code, created_at desc);

alter table public.admin_access_grants enable row level security;
alter table public.admin_access_grant_events enable row level security;
revoke all on table public.admin_access_grants, public.admin_access_grant_events from anon, authenticated;

-- Ralf (RM22) keeps every former superadmin power as a grant.
insert into public.admin_access_grants (fast_code, display_name, email, permissions, granted_by)
select 'RM22', 'Ralf', 'remecom@mac.com',
  array['build-requests','marketing','mapsites','partner-linking','seo','bookshelves','pmc-pins','fast-codes','agents']::text[],
  'ARUN'
where not exists (
  select 1 from public.admin_access_grants where fast_code = 'RM22' and revoked_at is null
);

insert into public.admin_access_grant_events (grant_id, fast_code, action, permissions, actor)
select g.id, g.fast_code, 'granted', g.permissions, 'ARUN (migration 104)'
from public.admin_access_grants g
where g.fast_code = 'RM22' and g.revoked_at is null
  and not exists (select 1 from public.admin_access_grant_events e where e.grant_id = g.id);
