-- Server-side sessions for FAST-code admins (Global Admin + granted admins).
-- The httpOnly `admin_session` cookie holds only a random 32-byte token; this
-- table stores its SHA-256 hash, never the token or a FAST Code. Server code
-- only (service role): RLS on, no policies, no anon/authenticated access.
-- Agent Admins keep their own `agent_admin_sessions` table (migration 096).

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null,
  access text not null check (access in ('global', 'granted')),
  grant_id uuid references public.admin_access_grants(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  constraint admin_sessions_token_hash_key unique (token_hash),
  constraint admin_sessions_token_hash_shape check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint admin_sessions_scope_ref check (
    (access = 'global' and grant_id is null)
    or (access = 'granted' and grant_id is not null)
  )
);

create index if not exists admin_sessions_grant_id_idx on public.admin_sessions (grant_id);
create index if not exists admin_sessions_active_idx on public.admin_sessions (expires_at) where revoked_at is null;

comment on table public.admin_sessions is
  'FAST-code admin sessions. Only a SHA-256 hash of the httpOnly cookie token is stored. Service role only.';

alter table public.admin_sessions enable row level security;
revoke all on table public.admin_sessions from anon, authenticated;
