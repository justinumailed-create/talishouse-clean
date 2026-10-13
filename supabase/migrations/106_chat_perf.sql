-- 106: Chat performance. The inbox and thread used to take 10–20 sequential
-- PostgREST round trips (Vercel iad1 → Supabase ca-central-1) per poll. These
-- functions do member resolution + presence, delivered/read receipts and the
-- whole read in ONE round trip. Server-only: execute revoked from anon and
-- authenticated; the app calls them with the service role after checking the
-- session cookie.

create extension if not exists pg_trgm with schema extensions;

-- receipts / unread scans
create index if not exists agent_chat_messages_undelivered_idx
  on public.agent_chat_messages (conversation_id) where delivered_at is null;
create index if not exists agent_chat_messages_unread_idx
  on public.agent_chat_messages (conversation_id) where read_at is null;
create index if not exists agent_chat_messages_reply_idx
  on public.agent_chat_messages (reply_to_id) where reply_to_id is not null;
-- message search (ILIKE '%q%')
create index if not exists agent_chat_messages_body_trgm_idx
  on public.agent_chat_messages using gin (body extensions.gin_trgm_ops);
create index if not exists agent_chat_reactions_member_idx on public.agent_chat_reactions (member_id);
create index if not exists agent_chat_typing_conv_time_idx on public.agent_chat_typing (conversation_id, typed_at desc);

-- Resolve (and create) the caller's chat identity and mark them online.
create or replace function public.chat_touch_member(p_agent uuid, p_admin text, p_name text)
returns uuid language plpgsql set search_path = public as $$
declare v uuid;
begin
  if p_agent is not null then
    insert into chat_members (agent_id, display_name, last_seen_at) values (p_agent, p_name, now())
    on conflict (agent_id) do update set last_seen_at = now(), display_name = excluded.display_name
    returning id into v;
    insert into agent_presence (agent_id, last_seen_at) values (p_agent, now())
    on conflict (agent_id) do update set last_seen_at = now();
  else
    insert into chat_members (admin_code, display_name, last_seen_at) values (p_admin, p_name, now())
    on conflict (admin_code) do update set last_seen_at = now(), display_name = excluded.display_name
    returning id into v;
  end if;
  return v;
end $$;

-- Who can chat right now: active agents, the Global Admin, active admin grants.
create or replace function public.chat_active_members(p_global text)
returns setof public.chat_members language sql stable set search_path = public as $$
  select cm.* from chat_members cm left join agent_admins a on a.id = cm.agent_id
  where (cm.agent_id is not null and a.status = 'active')
     or cm.admin_code = p_global
     or cm.admin_code in (select g.fast_code from admin_access_grants g where g.revoked_at is null)
$$;

create or replace function public.chat_inbox(p_agent uuid, p_admin text, p_name text, p_global text, p_global_name text)
returns jsonb language plpgsql set search_path = public as $$
declare me uuid; upd uuid; res jsonb;
begin
  me := chat_touch_member(p_agent, p_admin, p_name);

  select id into upd from agent_chat_conversations where pair_key = 'updates';
  if upd is null then
    insert into agent_chat_conversations (pair_key, kind) values ('updates', 'updates') on conflict (pair_key) do nothing;
    select id into upd from agent_chat_conversations where pair_key = 'updates';
  end if;
  insert into agent_chat_participants (conversation_id, member_id) values (upd, me) on conflict do nothing;

  -- directory: every active agent and FAST-code admin can be messaged
  insert into chat_members (agent_id, display_name)
    select id, name from agent_admins where status = 'active' on conflict (agent_id) do nothing;
  insert into chat_members (admin_code, display_name) values (p_global, p_global_name) on conflict (admin_code) do nothing;
  insert into chat_members (admin_code, display_name)
    select g.fast_code, coalesce(nullif(btrim(g.display_name), ''), g.fast_code) from admin_access_grants g where g.revoked_at is null
    on conflict (admin_code) do nothing;

  -- my client has now received every DM waiting for me
  update agent_chat_messages m set delivered_at = now()
    from agent_chat_participants p join agent_chat_conversations c on c.id = p.conversation_id and c.kind = 'dm'
    where p.member_id = me and m.conversation_id = p.conversation_id
      and m.delivered_at is null and m.sender_member_id <> me;
  update agent_chat_participants set last_delivered_at = now() where member_id = me;

  with mine as (
    select p.conversation_id, p.last_read_at, c.kind, c.last_message_at
    from agent_chat_participants p join agent_chat_conversations c on c.id = p.conversation_id
    where p.member_id = me
  )
  select jsonb_build_object(
    'me', me,
    'convs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', mine.conversation_id, 'kind', mine.kind, 'lastMessageAt', mine.last_message_at,
        'peerId', (select p2.member_id from agent_chat_participants p2 where p2.conversation_id = mine.conversation_id and p2.member_id <> me and mine.kind = 'dm' limit 1),
        'unread', (select count(*) from agent_chat_messages m where m.conversation_id = mine.conversation_id and m.sender_member_id <> me
                     and m.deleted_at is null and (mine.last_read_at is null or m.created_at > mine.last_read_at)),
        'last', (select jsonb_build_object('body', left(m.body, 200), 'deletedAt', m.deleted_at, 'fileName', m.file_name,
                   'ebookTitle', m.ebook_title, 'senderId', m.sender_member_id, 'createdAt', m.created_at)
                 from agent_chat_messages m where m.conversation_id = mine.conversation_id order by m.created_at desc limit 1)
      )) from mine), '[]'::jsonb),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'name', a.display_name, 'kind', case when a.agent_id is null then 'admin' else 'agent' end,
        'lastSeenAt', a.last_seen_at, 'signedOutAt', a.signed_out_at))
      from chat_active_members(p_global) a), '[]'::jsonb)
  ) into res;
  return res;
end $$;

create or replace function public.chat_thread(p_agent uuid, p_admin text, p_name text, p_global text, p_conv uuid, p_mark_read boolean, p_typing_ttl_ms int default 6000)
returns jsonb language plpgsql set search_path = public as $$
declare me uuid; conv record; peer uuid; now_ts timestamptz := now(); res jsonb;
begin
  me := chat_touch_member(p_agent, p_admin, p_name);
  select id, kind into conv from agent_chat_conversations where id = p_conv;
  if not found then return null; end if;
  if conv.kind = 'updates' then
    insert into agent_chat_participants (conversation_id, member_id) values (conv.id, me) on conflict do nothing;
  elsif not exists (select 1 from agent_chat_participants where conversation_id = conv.id and member_id = me) then
    return null; -- not a participant
  end if;

  if conv.kind = 'dm' then
    if p_mark_read then
      update agent_chat_messages set read_at = now_ts, delivered_at = coalesce(delivered_at, now_ts)
        where conversation_id = conv.id and read_at is null and sender_member_id <> me;
    else
      update agent_chat_messages set delivered_at = now_ts
        where conversation_id = conv.id and delivered_at is null and sender_member_id <> me;
    end if;
    select member_id into peer from agent_chat_participants where conversation_id = conv.id and member_id <> me limit 1;
  end if;
  update agent_chat_participants
    set last_delivered_at = now_ts, last_read_at = case when p_mark_read then now_ts else last_read_at end
    where conversation_id = conv.id and member_id = me;

  with msgs as (
    select * from agent_chat_messages where conversation_id = conv.id order by created_at desc limit 200
  )
  select jsonb_build_object(
    'me', me,
    'id', conv.id,
    'kind', conv.kind,
    'peer', (select jsonb_build_object('id', cm.id, 'name', cm.display_name, 'kind', case when cm.agent_id is null then 'admin' else 'agent' end,
               'lastSeenAt', cm.last_seen_at, 'signedOutAt', cm.signed_out_at,
               'active', exists (select 1 from chat_active_members(p_global) a where a.id = cm.id))
             from chat_members cm where cm.id = peer),
    'memberCount', case when conv.kind = 'updates' then (select count(*) from chat_active_members(p_global)) else 2 end,
    'typing', coalesce((select jsonb_agg(cm.display_name) from agent_chat_typing t join chat_members cm on cm.id = t.member_id
               where t.conversation_id = conv.id and t.member_id <> me and t.typed_at > now_ts - make_interval(secs => p_typing_ttl_ms / 1000.0)), '[]'::jsonb),
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'senderId', m.sender_member_id, 'senderName', coalesce(s.display_name, 'Former member'),
        'body', m.body, 'createdAt', m.created_at, 'editedAt', m.edited_at, 'deletedAt', m.deleted_at,
        'deliveredAt', m.delivered_at, 'readAt', m.read_at, 'pinnedAt', m.pinned_at,
        'filePath', m.file_path, 'fileName', m.file_name, 'fileMime', m.file_mime, 'fileSize', m.file_size,
        'ebookFastCode', m.ebook_fast_code, 'ebookId', m.ebook_id, 'ebookTitle', m.ebook_title,
        'replyTo', case when r.id is null then null else jsonb_build_object('id', r.id, 'senderName', coalesce(rs.display_name, 'Former member'),
                     'body', left(r.body, 200), 'deletedAt', r.deleted_at, 'fileName', r.file_name, 'ebookTitle', r.ebook_title) end,
        'reactions', coalesce((select jsonb_agg(jsonb_build_object('emoji', x.emoji, 'count', x.n, 'mine', x.mine) order by x.first_at)
                     from (select emoji, count(*) n, bool_or(member_id = me) mine, min(created_at) first_at
                           from agent_chat_reactions where message_id = m.id group by emoji) x), '[]'::jsonb)
      ) order by m.created_at)
      from msgs m
      left join chat_members s on s.id = m.sender_member_id
      left join agent_chat_messages r on r.id = m.reply_to_id
      left join chat_members rs on rs.id = r.sender_member_id
    ), '[]'::jsonb)
  ) into res;
  return res;
end $$;

revoke all on function public.chat_touch_member(uuid, text, text) from public, anon, authenticated;
revoke all on function public.chat_active_members(text) from public, anon, authenticated;
revoke all on function public.chat_inbox(uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.chat_thread(uuid, text, text, text, uuid, boolean, int) from public, anon, authenticated;
grant execute on function public.chat_touch_member(uuid, text, text) to service_role;
grant execute on function public.chat_active_members(text) to service_role;
grant execute on function public.chat_inbox(uuid, text, text, text, text) to service_role;
grant execute on function public.chat_thread(uuid, text, text, text, uuid, boolean, int) to service_role;
