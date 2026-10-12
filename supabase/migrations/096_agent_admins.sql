-- Agent Admins: DB-backed /admin accounts managed by superadmin under Admin → Agents.
-- Agents sign in at /agent/login with a login ID + password (bcrypt hash; never plaintext).
-- Hardcoded full/superadmin accounts (ADMIN_ACCOUNTS in lib/admin-constants.ts) are unchanged.
-- Additive only. RLS on with NO anon/authenticated policies: server-side (service role) access only.
-- Audit trail reuses public.activity_logs (table_name = 'agent_admins').

create table if not exists public.agent_admins (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  login_id text not null,
  password_hash text,
  must_change_password boolean not null default true,
  failed_login_attempts integer not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  password_changed_at timestamptz,
  status text not null default 'active',
  privileges text[] not null default '{}'::text[],
  assigned_mapsites text[] not null default '{}'::text[],
  regions text[] not null default '{}'::text[],
  page_headline text,
  page_subtext text,
  page_cta text,
  page_bio text,
  video_url text,
  show_contact_form boolean not null default true,
  notes text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agent_admins_login_id_key unique (login_id),
  constraint agent_admins_login_id_shape check (login_id ~ '^[a-z0-9._-]{3,32}$'),
  constraint agent_admins_status_check check (status in ('active', 'disabled')),
  constraint agent_admins_privileges_check check (
    privileges <@ array['mapsites', 'talisbooks', 'build-requests', 'leads', 'agent-pages']::text[]
  )
);

comment on table public.agent_admins is
  'Agent Admin accounts (login ID + bcrypt password at /agent/login). Managed by superadmin under /admin/agents. Server-side (service role) access only.';

create table if not exists public.agent_admin_sessions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agent_admins(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint agent_admin_sessions_token_hash_key unique (token_hash)
);

create index if not exists agent_admin_sessions_agent_id_idx on public.agent_admin_sessions (agent_id);

comment on table public.agent_admin_sessions is
  'Agent Admin sessions. Only a SHA-256 hash of the httpOnly cookie token is stored.';

alter table public.agent_admins enable row level security;
alter table public.agent_admin_sessions enable row level security;
revoke all on table public.agent_admins from anon, authenticated;
revoke all on table public.agent_admin_sessions from anon, authenticated;
