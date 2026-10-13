-- 101: Chat v2. Standalone /chat app for agents and FAST-code admins.
-- Identities move to chat_members (an agent OR a hardcoded admin code) so admins
-- can be DM participants. Adds an "Updates" channel, per-message receipts,
-- replies, edits/deletes, pins, reactions, typing, attachments and eBook cards.
-- Existing conversations/messages are preserved and backfilled.
-- RLS on everywhere, no client policies: all access is server code that checks
-- the session and conversation membership.

create table if not exists public.chat_members (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid unique references public.agent_admins(id) on delete cascade,
  admin_code text unique,
  display_name text not null,
  last_seen_at timestamptz,
  signed_out_at timestamptz,
  created_at timestamptz not null default now(),
  constraint chat_members_one_identity check ((agent_id is null) <> (admin_code is null))
);

alter table public.agent_admins add column if not exists chat_on_login boolean not null default true;

-- every existing agent gets a member row
insert into public.chat_members (agent_id, display_name, last_seen_at, signed_out_at)
select a.id, a.name, p.last_seen_at, p.signed_out_at
from public.agent_admins a left join public.agent_presence p on p.agent_id = a.id
on conflict (agent_id) do nothing;

-- conversations: kind + (for DMs) pair_key over member ids
alter table public.agent_chat_conversations add column if not exists kind text not null default 'dm';
alter table public.agent_chat_conversations drop constraint if exists agent_chat_conversations_kind_check;
alter table public.agent_chat_conversations add constraint agent_chat_conversations_kind_check check (kind in ('dm', 'updates'));

-- participants: member_id replaces agent_id
alter table public.agent_chat_participants add column if not exists member_id uuid references public.chat_members(id) on delete cascade;
update public.agent_chat_participants p set member_id = m.id from public.chat_members m where m.agent_id = p.agent_id and p.member_id is null;
alter table public.agent_chat_participants drop constraint if exists agent_chat_participants_pkey;
alter table public.agent_chat_participants alter column agent_id drop not null;
delete from public.agent_chat_participants where member_id is null;
alter table public.agent_chat_participants alter column member_id set not null;
alter table public.agent_chat_participants add primary key (conversation_id, member_id);
create index if not exists agent_chat_participants_member_idx on public.agent_chat_participants (member_id);

-- re-key existing DM pairs on member ids
update public.agent_chat_conversations c
set pair_key = sub.k
from (
  select conversation_id, string_agg(member_id::text, ':' order by member_id::text) as k
  from public.agent_chat_participants group by conversation_id
) sub
where sub.conversation_id = c.id and c.kind = 'dm';

-- messages
alter table public.agent_chat_messages add column if not exists sender_member_id uuid references public.chat_members(id) on delete cascade;
update public.agent_chat_messages msg set sender_member_id = m.id from public.chat_members m where m.agent_id = msg.sender_id and msg.sender_member_id is null;
alter table public.agent_chat_messages alter column sender_id drop not null;
delete from public.agent_chat_messages where sender_member_id is null;
alter table public.agent_chat_messages alter column sender_member_id set not null;
alter table public.agent_chat_messages drop constraint if exists agent_chat_messages_body_check;
alter table public.agent_chat_messages
  add column if not exists reply_to_id uuid references public.agent_chat_messages(id) on delete set null,
  add column if not exists edited_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists read_at timestamptz,
  add column if not exists pinned_at timestamptz,
  add column if not exists pinned_by uuid references public.chat_members(id) on delete set null,
  add column if not exists file_path text,
  add column if not exists file_name text,
  add column if not exists file_mime text,
  add column if not exists file_size bigint check (file_size is null or file_size <= 10485760),
  add column if not exists ebook_fast_code text,
  add column if not exists ebook_id uuid,
  add column if not exists ebook_title text;
alter table public.agent_chat_messages add constraint agent_chat_messages_body_check
  check (char_length(body) <= 4000 and (char_length(body) > 0 or file_path is not null or ebook_id is not null or deleted_at is not null));
create index if not exists agent_chat_messages_sender_idx on public.agent_chat_messages (sender_member_id);
create index if not exists agent_chat_messages_pinned_idx on public.agent_chat_messages (conversation_id) where pinned_at is not null;

-- backfill receipts from the old per-participant watermarks
update public.agent_chat_messages msg
set delivered_at = case when p.last_delivered_at >= msg.created_at then p.last_delivered_at end,
    read_at = case when p.last_read_at >= msg.created_at then p.last_read_at end
from public.agent_chat_participants p
where p.conversation_id = msg.conversation_id and p.member_id <> msg.sender_member_id and msg.delivered_at is null;

create table if not exists public.agent_chat_reactions (
  message_id uuid not null references public.agent_chat_messages(id) on delete cascade,
  member_id uuid not null references public.chat_members(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  primary key (message_id, member_id, emoji)
);

create table if not exists public.agent_chat_typing (
  conversation_id uuid not null references public.agent_chat_conversations(id) on delete cascade,
  member_id uuid not null references public.chat_members(id) on delete cascade,
  typed_at timestamptz not null default now(),
  primary key (conversation_id, member_id)
);

-- the single Updates channel
insert into public.agent_chat_conversations (pair_key, kind) values ('updates', 'updates') on conflict (pair_key) do nothing;

alter table public.chat_members enable row level security;
alter table public.agent_chat_reactions enable row level security;
alter table public.agent_chat_typing enable row level security;
revoke all on table public.chat_members, public.agent_chat_reactions, public.agent_chat_typing from anon, authenticated;
