-- Comments Ralf leaves for TalisBOT™ / Tsplits Lead Sourcing.
create table if not exists public.admin_talisbot_comments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.admin_talisbot_messages(id) on delete set null,
  body text not null,
  author text not null,
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'seen', 'answered')),
  answered_at timestamptz,
  constraint admin_talisbot_comments_body_len check (char_length(btrim(body)) between 1 and 4000),
  constraint admin_talisbot_comments_author_len check (char_length(btrim(author)) between 1 and 120)
);

create index if not exists admin_talisbot_comments_message_id_idx
  on public.admin_talisbot_comments (message_id, created_at);
create index if not exists admin_talisbot_comments_status_idx
  on public.admin_talisbot_comments (status, created_at desc)
  where status = 'new';

alter table public.admin_talisbot_comments enable row level security;
revoke all on table public.admin_talisbot_comments from public, anon, authenticated;
grant select, insert, update on table public.admin_talisbot_comments to service_role;

comment on table public.admin_talisbot_comments is
  'Ralf (and admins) comments to TalisBOT™. Sourcing bot reads status=new, replies via admin_talisbot_messages type=reply, then sets answered.';

alter table public.admin_talisbot_messages
  add column if not exists reply_to_comment_id uuid references public.admin_talisbot_comments(id) on delete set null;

create index if not exists admin_talisbot_messages_reply_to_comment_idx
  on public.admin_talisbot_messages (reply_to_comment_id)
  where reply_to_comment_id is not null;

comment on column public.admin_talisbot_messages.reply_to_comment_id is
  'When type=reply from TalisBOT/sourcing: the admin_talisbot_comments row being answered. parent_id remains for message-thread replies.';
comment on column public.admin_talisbot_messages.parent_id is
  'Optional parent message for UI threading. Sourcing bot replies to comments use reply_to_comment_id.';
