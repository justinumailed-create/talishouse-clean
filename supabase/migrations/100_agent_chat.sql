-- 100: Private 1:1 agent chat. Only participants may read messages; every read
-- goes through server code that checks the agent_session and participation.
-- There is no admin UI or API for message content. RLS on, no client policies.

create table if not exists public.agent_chat_conversations (
  id uuid primary key default gen_random_uuid(),
  -- sorted "agentA:agentB" so each pair has exactly one conversation
  pair_key text not null unique,
  created_at timestamptz not null default now(),
  last_message_at timestamptz
);

create table if not exists public.agent_chat_participants (
  conversation_id uuid not null references public.agent_chat_conversations(id) on delete cascade,
  agent_id uuid not null references public.agent_admins(id) on delete cascade,
  last_delivered_at timestamptz,
  last_read_at timestamptz,
  primary key (conversation_id, agent_id)
);
create index if not exists agent_chat_participants_agent_idx on public.agent_chat_participants (agent_id);

create table if not exists public.agent_chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.agent_chat_conversations(id) on delete cascade,
  sender_id uuid not null references public.agent_admins(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists agent_chat_messages_conv_idx on public.agent_chat_messages (conversation_id, created_at);

alter table public.agent_chat_conversations enable row level security;
alter table public.agent_chat_participants enable row level security;
alter table public.agent_chat_messages enable row level security;
revoke all on table public.agent_chat_conversations, public.agent_chat_participants, public.agent_chat_messages from anon, authenticated;
