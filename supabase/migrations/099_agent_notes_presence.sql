-- 099: Agent daily notes + document uploads, and agent presence (online / last seen).
-- Server-side (service role) access only: RLS on, no anon/authenticated policies.

create table if not exists public.agent_daily_notes (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agent_admins(id) on delete cascade,
  note_date date not null,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists agent_daily_notes_agent_date_idx on public.agent_daily_notes (agent_id, note_date desc);
create index if not exists agent_daily_notes_date_idx on public.agent_daily_notes (note_date desc);

create table if not exists public.agent_note_files (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agent_admins(id) on delete cascade,
  note_date date not null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now()
);
create index if not exists agent_note_files_agent_date_idx on public.agent_note_files (agent_id, note_date desc);

create table if not exists public.agent_presence (
  agent_id uuid primary key references public.agent_admins(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  signed_out_at timestamptz
);

alter table public.agent_daily_notes enable row level security;
alter table public.agent_note_files enable row level security;
alter table public.agent_presence enable row level security;
revoke all on table public.agent_daily_notes, public.agent_note_files, public.agent_presence from anon, authenticated;

-- Private bucket for note documents: 10 MB, documents + images only. Signed URLs only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'agent-notes', 'agent-notes', false, 10485760,
  array[
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
