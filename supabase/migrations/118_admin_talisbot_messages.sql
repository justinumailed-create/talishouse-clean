-- TalisBOT™ messages for the Admin dashboard (Ralf). Dismiss = mark read; never delete.
create table if not exists public.admin_talisbot_messages (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('progress', 'result', 'assigned', 'needs_review', 'reply')),
  title text not null,
  body text not null,
  fast_code text,
  brokerage text,
  prospect_queue_id uuid references public.prospect_queue(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_by text not null default 'talisbot',
  parent_id uuid references public.admin_talisbot_messages(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint admin_talisbot_messages_title_len check (char_length(btrim(title)) between 1 and 200),
  constraint admin_talisbot_messages_body_len check (char_length(btrim(body)) between 1 and 4000),
  constraint admin_talisbot_messages_fast_code_len check (
    fast_code is null or (fast_code = lower(fast_code) and char_length(fast_code) between 2 and 16)
  ),
  constraint admin_talisbot_messages_brokerage_len check (
    brokerage is null or char_length(brokerage) between 1 and 200
  )
);

create index if not exists admin_talisbot_messages_created_at_idx
  on public.admin_talisbot_messages (created_at desc);
create index if not exists admin_talisbot_messages_unread_idx
  on public.admin_talisbot_messages (created_at desc)
  where read_at is null;
create index if not exists admin_talisbot_messages_type_idx
  on public.admin_talisbot_messages (type, created_at desc);
create index if not exists admin_talisbot_messages_fast_code_idx
  on public.admin_talisbot_messages (fast_code)
  where fast_code is not null;

alter table public.admin_talisbot_messages enable row level security;
revoke all on table public.admin_talisbot_messages from public, anon, authenticated;
grant select, insert, update on table public.admin_talisbot_messages to service_role;

comment on table public.admin_talisbot_messages is
  'TalisBOT™ messages for Ralf on the Admin dashboard. Dismiss marks read; never delete. Sourcing bots insert via service role.';
comment on column public.admin_talisbot_messages.type is
  'progress | result | assigned | needs_review | reply';
