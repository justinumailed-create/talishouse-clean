import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSessionAccount } from "../admin-auth";
import { GLOBAL_ADMIN_ACCOUNT, GLOBAL_ADMIN_FAST_CODE, isGlobalAdmin, type AdminAccount } from "../admin-constants";
import { agentCanEditMapSite, canManageMapSiteEbooks } from "../mapsite-edit-auth";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "../supabaseAdmin";
import {
  CHAT_FILES_BUCKET,
  CHAT_MAX_CHARS,
  CHAT_TYPING_TTL_MS,
  canEditMessage,
  cleanChatBody,
  dmPairKey,
  isAllowedReaction,
  isUuid,
  likePattern,
  makeLimiter,
  messagePreview,
  validateChatFile,
} from "./model";

/**
 * Server-only chat v2 data access. Every table has RLS on with no client
 * policies; this service-role code is the only reader and always checks that
 * the signed-in member participates in the conversation (the Updates channel
 * is the one conversation every member belongs to). Chat content is never
 * written to activity_logs.
 */

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

export type ChatResult<T = undefined> = { ok: true; value?: T } | { ok: false; error: string };

export interface ChatMe {
  memberId: string;
  name: string;
  kind: "agent" | "admin";
  agentId: string | null;
  adminCode: string | null;
  account: AdminAccount;
}

export interface ChatPresence {
  lastSeenAt: string | null;
  signedOutAt: string | null;
}

type MemberRow = { id: string; agent_id: string | null; admin_code: string | null; display_name: string; last_seen_at: string | null; signed_out_at: string | null };

export interface ChatIdentity {
  name: string;
  kind: "agent" | "admin";
  agentId: string | null;
  adminCode: string | null;
  account: AdminAccount;
}

/**
 * Signed-in agent (past first-login password change) or FAST-code admin.
 * Only resolves the session (no chat tables touched): the chat_* SQL
 * functions resolve the member row + presence inside their single round trip.
 */
export async function getChatIdentity(): Promise<ChatIdentity | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const account = await getAdminSessionAccount();
  if (!account) return null;
  if (account.access === "agent") {
    if (!account.agentId || account.mustChangePassword) return null;
    return { name: account.name, kind: "agent", agentId: account.agentId, adminCode: null, account };
  }
  return { name: account.name, kind: "admin", agentId: null, adminCode: account.fastCode, account };
}

function rpcIdentity(id: ChatIdentity) {
  return { p_agent: id.agentId, p_admin: id.adminCode, p_name: id.name };
}

/** Identity + member id (one RPC: upsert member row, mark online). Used by writes. */
export async function getChatMe(): Promise<ChatMe | null> {
  const id = await getChatIdentity();
  if (!id) return null;
  const { data, error } = await db().rpc("chat_touch_member", rpcIdentity(id));
  if (error || !data) return null;
  return { memberId: data as string, ...id };
}

// ---------------------------------------------------------------- presence

export async function touchChatPresence(me: ChatMe): Promise<void> {
  const now = new Date().toISOString();
  await db().from("chat_members").update({ last_seen_at: now }).eq("id", me.memberId);
  if (me.agentId) {
    await db().from("agent_presence").upsert({ agent_id: me.agentId, last_seen_at: now }, { onConflict: "agent_id" });
  }
}

/** Keep chat presence in step with the admin-console heartbeat / sign-out. */
export async function syncAgentChatPresence(agentId: string, field: "last_seen_at" | "signed_out_at"): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  await db().from("chat_members").update({ [field]: new Date().toISOString() }).eq("agent_id", agentId);
}


// ---------------------------------------------------------------- inbox

export interface InboxItem {
  conversationId: string | null;
  kind: "dm" | "updates";
  title: string;
  peerMemberId: string | null;
  peerKind: "agent" | "admin" | null;
  presence: ChatPresence | null;
  preview: string;
  previewMine: boolean;
  lastAt: string | null;
  unread: number;
}

type ConvRow = { id: string; kind: "dm" | "updates"; pair_key: string; last_message_at: string | null };

type RpcMember = { id: string; name: string; kind: "agent" | "admin"; lastSeenAt: string | null; signedOutAt: string | null };
type RpcInbox = {
  me: string;
  convs: Array<{ id: string; kind: "dm" | "updates"; lastMessageAt: string | null; peerId: string | null; unread: number;
    last: { body: string; deletedAt: string | null; fileName: string | null; ebookTitle: string | null; senderId: string; createdAt: string } | null }>;
  members: RpcMember[];
};

async function ensureParticipant(conversationId: string, memberId: string): Promise<void> {
  await db().from("agent_chat_participants").upsert({ conversation_id: conversationId, member_id: memberId }, { onConflict: "conversation_id,member_id", ignoreDuplicates: true });
}

/** Inbox in ONE database round trip (chat_inbox also marks waiting DMs delivered). */
export async function listInbox(id: ChatIdentity): Promise<InboxItem[]> {
  const { data, error } = await db().rpc("chat_inbox", {
    ...rpcIdentity(id), p_global: GLOBAL_ADMIN_FAST_CODE, p_global_name: GLOBAL_ADMIN_ACCOUNT.name,
  });
  if (error || !data) throw new Error(`chat_inbox failed: ${error?.message ?? "no data"}`);
  const r = data as RpcInbox;
  const me = r.me;
  const members = new Map(r.members.map((m) => [m.id, m]));
  const list: InboxItem[] = [];
  for (const c of r.convs) {
    const lm = c.last;
    const preview = lm ? messagePreview({ body: lm.body, deletedAt: lm.deletedAt, fileName: lm.fileName, ebookTitle: lm.ebookTitle }) : "";
    const lastAt = lm?.createdAt ?? c.lastMessageAt;
    const previewMine = Boolean(lm && lm.senderId === me);
    if (c.kind === "updates") {
      const who = lm && lm.senderId !== me ? `${members.get(lm.senderId)?.name ?? "Someone"}: ` : "";
      list.push({ conversationId: c.id, kind: "updates", title: "Updates", peerMemberId: null, peerKind: null, presence: null,
        preview: lm ? who + preview : "Status updates for everyone", previewMine, lastAt, unread: Number(c.unread) || 0 });
      continue;
    }
    const peer = c.peerId ? members.get(c.peerId) : undefined;
    if (!peer) continue; // peer disabled/removed
    list.push({ conversationId: c.id, kind: "dm", title: peer.name, peerMemberId: peer.id, peerKind: peer.kind,
      presence: { lastSeenAt: peer.lastSeenAt, signedOutAt: peer.signedOutAt }, preview, previewMine, lastAt, unread: Number(c.unread) || 0 });
  }
  const withConv = new Set(list.map((i) => i.peerMemberId).filter(Boolean));
  for (const m of r.members) {
    if (m.id === me || withConv.has(m.id)) continue;
    list.push({ conversationId: null, kind: "dm", title: m.name, peerMemberId: m.id, peerKind: m.kind,
      presence: { lastSeenAt: m.lastSeenAt, signedOutAt: m.signedOutAt }, preview: "", previewMine: false, lastAt: null, unread: 0 });
  }
  return list.sort((a, b) =>
    (b.lastAt ?? "").localeCompare(a.lastAt ?? "") || (a.kind === "updates" ? -1 : b.kind === "updates" ? 1 : a.title.localeCompare(b.title)));
}

type PartRow = { conversation_id: string; last_read_at: string | null };

async function unreadIn(conversationId: string, me: string, lastReadAt: string | null): Promise<number> {
  let q = db().from("agent_chat_messages").select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId).neq("sender_member_id", me).is("deleted_at", null);
  if (lastReadAt) q = q.gt("created_at", lastReadAt);
  const { count } = await q;
  return count ?? 0;
}

export async function countChatUnread(memberId: string): Promise<number> {
  if (!isSupabaseAdminConfigured()) return 0;
  const { data } = await db().from("agent_chat_participants").select("conversation_id, last_read_at").eq("member_id", memberId);
  const counts = await Promise.all(((data ?? []) as PartRow[]).map((r) => unreadIn(r.conversation_id, memberId, r.last_read_at)));
  return counts.reduce((a, b) => a + b, 0);
}

export async function countUnreadForAgent(agentId: string): Promise<number> {
  if (!isSupabaseAdminConfigured()) return 0;
  const { data } = await db().from("chat_members").select("id").eq("agent_id", agentId).maybeSingle();
  return data ? countChatUnread((data as { id: string }).id) : 0;
}

// ---------------------------------------------------------------- conversations

/** The conversation, only if `me` is allowed in it. */
async function conversationFor(me: ChatMe, conversationId: string): Promise<ConvRow | null> {
  if (!isUuid(conversationId)) return null;
  const { data } = await db().from("agent_chat_conversations").select("id, kind, pair_key, last_message_at").eq("id", conversationId).maybeSingle();
  const conv = data as ConvRow | null;
  if (!conv) return null;
  if (conv.kind === "updates") {
    await ensureParticipant(conv.id, me.memberId);
    return conv;
  }
  const { data: part } = await db().from("agent_chat_participants").select("member_id").eq("conversation_id", conv.id).eq("member_id", me.memberId).maybeSingle();
  return part ? conv : null;
}

export async function openDm(me: ChatMe, peerMemberId: string): Promise<ChatResult<string>> {
  if (!isUuid(peerMemberId) || peerMemberId === me.memberId) return { ok: false, error: "Pick someone to chat with." };
  const { data: active } = await db().rpc("chat_active_members", { p_global: GLOBAL_ADMIN_FAST_CODE }).eq("id", peerMemberId);
  if (!((active ?? []) as unknown[]).length) return { ok: false, error: "That person is not available." };
  const key = dmPairKey(me.memberId, peerMemberId);
  const find = async () => ((await db().from("agent_chat_conversations").select("id").eq("pair_key", key).maybeSingle()).data as { id: string } | null)?.id ?? null;
  let id = await find();
  if (!id) {
    const { data } = await db().from("agent_chat_conversations").insert({ pair_key: key, kind: "dm" }).select("id").single();
    id = (data as { id: string } | null)?.id ?? (await find());
    if (!id) return { ok: false, error: "Could not open the conversation." };
  }
  await db().from("agent_chat_participants").upsert(
    [{ conversation_id: id, member_id: me.memberId }, { conversation_id: id, member_id: peerMemberId }],
    { onConflict: "conversation_id,member_id", ignoreDuplicates: true },
  );
  return { ok: true, value: id };
}

export interface ChatMessageView {
  id: string;
  mine: boolean;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  pinnedAt: string | null;
  replyTo: { id: string; senderName: string; preview: string } | null;
  reactions: Array<{ emoji: string; count: number; mine: boolean }>;
  file: { name: string; mime: string; size: number; url: string | null } | null;
  ebook: { fastCode: string; bookId: string; title: string; canEdit: boolean } | null;
}

export interface ChatThreadView {
  conversationId: string;
  kind: "dm" | "updates";
  title: string;
  peer: { memberId: string; kind: "agent" | "admin"; presence: ChatPresence } | null;
  messages: ChatMessageView[];
  typing: string[];
  memberCount: number;
}

type MsgRow = {
  id: string; sender_member_id: string; body: string; created_at: string; edited_at: string | null; deleted_at: string | null;
  delivered_at: string | null; read_at: string | null; pinned_at: string | null; reply_to_id: string | null;
  file_path: string | null; file_name: string | null; file_mime: string | null; file_size: number | null;
  ebook_fast_code: string | null; ebook_id: string | null; ebook_title: string | null;
};
const MSG_COLS = "id, sender_member_id, body, created_at, edited_at, deleted_at, delivered_at, read_at, pinned_at, reply_to_id, file_path, file_name, file_mime, file_size, ebook_fast_code, ebook_id, ebook_title";

type RpcMsg = {
  id: string; senderId: string; senderName: string; body: string; createdAt: string; editedAt: string | null; deletedAt: string | null;
  deliveredAt: string | null; readAt: string | null; pinnedAt: string | null;
  filePath: string | null; fileName: string | null; fileMime: string | null; fileSize: number | null;
  ebookFastCode: string | null; ebookId: string | null; ebookTitle: string | null;
  replyTo: { id: string; senderName: string; body: string; deletedAt: string | null; fileName: string | null; ebookTitle: string | null } | null;
  reactions: Array<{ emoji: string; count: number; mine: boolean }>;
};
type RpcThread = {
  me: string; id: string; kind: "dm" | "updates"; memberCount: number; typing: string[];
  peer: (RpcMember & { active: boolean }) | null;
  messages: RpcMsg[];
};

/** eBook edit access without network calls for agents and the Global Admin. */
async function ebookAccess(id: ChatIdentity, fastCodes: string[]): Promise<Map<string, boolean>> {
  const out = new Map<string, boolean>();
  for (const fc of fastCodes) {
    if (isGlobalAdmin(id.account)) out.set(fc, true);
    else if (id.kind === "agent") out.set(fc, agentCanEditMapSite(id.account, fc, "ebooks") || agentCanEditMapSite(id.account, fc, "mapsites"));
    else out.set(fc, await canManageMapSiteEbooks(fc).catch(() => false));
  }
  return out;
}

/** Whole thread in ONE database round trip (+1 storage call only when it has attachments). */
export async function readThread(id: ChatIdentity, conversationId: string, markRead: boolean): Promise<ChatThreadView | null> {
  if (!isUuid(conversationId)) return null;
  const { data, error } = await db().rpc("chat_thread", {
    ...rpcIdentity(id), p_global: GLOBAL_ADMIN_FAST_CODE, p_conv: conversationId, p_mark_read: markRead, p_typing_ttl_ms: CHAT_TYPING_TTL_MS,
  });
  if (error) throw new Error(`chat_thread failed: ${error.message}`);
  if (!data) return null;
  const t = data as RpcThread;
  const deletedOr = (m: RpcMsg) => Boolean(m.deletedAt);
  const paths = t.messages.filter((m) => m.filePath && !deletedOr(m)).map((m) => m.filePath!);
  const fastCodes = [...new Set(t.messages.map((m) => m.ebookFastCode).filter((x): x is string => Boolean(x)))];
  const [signed, access] = await Promise.all([
    paths.length ? db().storage.from(CHAT_FILES_BUCKET).createSignedUrls(paths, 3600) : Promise.resolve({ data: [] }),
    ebookAccess(id, fastCodes),
  ]);
  const urlByPath = new Map<string, string>();
  ((signed.data ?? []) as Array<{ path: string | null; signedUrl: string | null }>).forEach((x, i) => {
    if (x.signedUrl) urlByPath.set(x.path ?? paths[i], x.signedUrl);
  });
  const updates = t.kind === "updates";
  const messages: ChatMessageView[] = t.messages.map((m) => {
    const deleted = deletedOr(m);
    return {
      id: m.id,
      mine: m.senderId === t.me,
      senderId: m.senderId,
      senderName: m.senderName,
      body: deleted ? "" : m.body,
      createdAt: m.createdAt,
      editedAt: m.editedAt,
      deletedAt: m.deletedAt,
      deliveredAt: updates ? null : m.deliveredAt,
      readAt: updates ? null : m.readAt,
      pinnedAt: deleted ? null : m.pinnedAt,
      replyTo: m.replyTo ? { id: m.replyTo.id, senderName: m.replyTo.senderName, preview: messagePreview({ body: m.replyTo.body, deletedAt: m.replyTo.deletedAt, fileName: m.replyTo.fileName, ebookTitle: m.replyTo.ebookTitle }) } : null,
      reactions: deleted ? [] : m.reactions ?? [],
      file: !deleted && m.filePath ? { name: m.fileName ?? "file", mime: m.fileMime ?? "", size: Number(m.fileSize ?? 0), url: urlByPath.get(m.filePath) ?? null } : null,
      ebook: !deleted && m.ebookId && m.ebookFastCode ? { fastCode: m.ebookFastCode, bookId: m.ebookId, title: m.ebookTitle ?? "eBook", canEdit: access.get(m.ebookFastCode) === true } : null,
    };
  });
  const peer = t.peer && t.peer.active ? { memberId: t.peer.id, kind: t.peer.kind, presence: { lastSeenAt: t.peer.lastSeenAt, signedOutAt: t.peer.signedOutAt } } : null;
  return {
    conversationId: t.id,
    kind: t.kind,
    title: updates ? "Updates" : t.peer?.name ?? "Conversation",
    peer,
    messages,
    typing: t.typing ?? [],
    memberCount: Number(t.memberCount) || 0,
  };
}

// ---------------------------------------------------------------- writes

const sendLimit = makeLimiter(30, 60_000);
const typingLimit = makeLimiter(30, 60_000);
const reactLimit = makeLimiter(60, 60_000);
const editLimit = makeLimiter(30, 60_000);
const uploadLimit = makeLimiter(20, 10 * 60_000);
const searchLimit = makeLimiter(30, 60_000);

async function touchConversation(id: string, at: string) {
  await db().from("agent_chat_conversations").update({ last_message_at: at }).eq("id", id);
}

export interface SendInput {
  body?: unknown;
  replyToId?: unknown;
  filePath?: unknown;
  ebook?: { fastCode?: unknown; bookId?: unknown } | null;
}

export async function sendMessage(me: ChatMe, conversationId: string, input: SendInput): Promise<ChatResult<string>> {
  if (sendLimit(me.memberId)) return { ok: false, error: "You are sending messages too fast." };
  const conv = await conversationFor(me, conversationId);
  if (!conv) return { ok: false, error: "Conversation not found." };
  const body = cleanChatBody(input.body);
  if (body.length > CHAT_MAX_CHARS) return { ok: false, error: `Messages are up to ${CHAT_MAX_CHARS} characters.` };
  const row: Record<string, unknown> = { conversation_id: conv.id, sender_member_id: me.memberId, sender_id: me.agentId, body };

  if (isUuid(input.replyToId)) {
    const { data } = await db().from("agent_chat_messages").select("id").eq("id", input.replyToId).eq("conversation_id", conv.id).maybeSingle();
    if (data) row.reply_to_id = input.replyToId;
  }

  if (typeof input.filePath === "string" && input.filePath) {
    const file = await verifyUpload(me, conv.id, input.filePath);
    if (!file.ok) return file;
    Object.assign(row, file.value);
  }

  if (input.ebook) {
    const fastCode = String(input.ebook.fastCode ?? "").trim().toLowerCase();
    const bookId = input.ebook.bookId;
    if (!fastCode || !isUuid(bookId)) return { ok: false, error: "Pick an eBook." };
    if (!(await canManageMapSiteEbooks(fastCode).catch(() => false))) return { ok: false, error: "You cannot share eBooks for that FAST Code." };
    const { data } = await db().from("talisbooks_books").select("id, title, fast_code").eq("id", bookId).maybeSingle();
    const book = data as { id: string; title: string | null; fast_code: string | null } | null;
    if (!book || (book.fast_code ?? "").trim().toLowerCase() !== fastCode) return { ok: false, error: "That eBook is not on this FAST Code." };
    Object.assign(row, { ebook_fast_code: fastCode, ebook_id: book.id, ebook_title: (book.title || "Untitled eBook").slice(0, 200) });
  }

  if (!body && !row.file_path && !row.ebook_id) return { ok: false, error: "Write a message first." };
  const { data, error } = await db().from("agent_chat_messages").insert(row).select("id, created_at").single();
  if (error || !data) return { ok: false, error: "Could not send the message." };
  const sent = data as { id: string; created_at: string };
  await Promise.all([
    touchConversation(conv.id, sent.created_at),
    db().from("agent_chat_participants").update({ last_read_at: sent.created_at, last_delivered_at: sent.created_at }).eq("conversation_id", conv.id).eq("member_id", me.memberId),
    db().from("agent_chat_typing").delete().eq("conversation_id", conv.id).eq("member_id", me.memberId),
  ]);
  return { ok: true, value: sent.id };
}

async function ownMessage(me: ChatMe, messageId: unknown): Promise<MsgRow & { conversation_id: string } | null> {
  if (!isUuid(messageId)) return null;
  const { data } = await db().from("agent_chat_messages").select(`${MSG_COLS}, conversation_id`).eq("id", messageId).maybeSingle();
  const m = data as (MsgRow & { conversation_id: string }) | null;
  if (!m || m.sender_member_id !== me.memberId) return null;
  return (await conversationFor(me, m.conversation_id)) ? m : null;
}

async function visibleMessage(me: ChatMe, messageId: unknown): Promise<(MsgRow & { conversation_id: string; kind: string }) | null> {
  if (!isUuid(messageId)) return null;
  const { data } = await db().from("agent_chat_messages").select(`${MSG_COLS}, conversation_id`).eq("id", messageId).maybeSingle();
  const m = data as (MsgRow & { conversation_id: string }) | null;
  if (!m) return null;
  const conv = await conversationFor(me, m.conversation_id);
  return conv ? { ...m, kind: conv.kind } : null;
}

export async function editMessage(me: ChatMe, messageId: unknown, body: unknown): Promise<ChatResult> {
  if (editLimit(me.memberId)) return { ok: false, error: "Slow down a little." };
  const m = await ownMessage(me, messageId);
  if (!m || !canEditMessage({ mine: true, deletedAt: m.deleted_at, createdAt: m.created_at })) return { ok: false, error: "You can only edit your own messages within 24 hours." };
  const text = cleanChatBody(body);
  if (!text && !m.file_path && !m.ebook_id) return { ok: false, error: "A message cannot be empty." };
  if (text.length > CHAT_MAX_CHARS) return { ok: false, error: `Messages are up to ${CHAT_MAX_CHARS} characters.` };
  const { error } = await db().from("agent_chat_messages").update({ body: text, edited_at: new Date().toISOString() }).eq("id", m.id);
  return error ? { ok: false, error: "Could not edit the message." } : { ok: true };
}

export async function deleteMessage(me: ChatMe, messageId: unknown): Promise<ChatResult> {
  if (editLimit(me.memberId)) return { ok: false, error: "Slow down a little." };
  const m = await ownMessage(me, messageId);
  if (!m || m.deleted_at) return { ok: false, error: "You can only delete your own messages." };
  if (m.file_path) await db().storage.from(CHAT_FILES_BUCKET).remove([m.file_path]);
  const { error } = await db().from("agent_chat_messages").update({
    body: "", deleted_at: new Date().toISOString(), file_path: null, file_name: null, file_mime: null, file_size: null,
    ebook_fast_code: null, ebook_id: null, ebook_title: null, pinned_at: null, pinned_by: null,
  }).eq("id", m.id);
  await db().from("agent_chat_reactions").delete().eq("message_id", m.id);
  return error ? { ok: false, error: "Could not delete the message." } : { ok: true };
}

export async function setPinned(me: ChatMe, messageId: unknown, pinned: boolean): Promise<ChatResult> {
  if (editLimit(me.memberId)) return { ok: false, error: "Slow down a little." };
  const m = await visibleMessage(me, messageId);
  if (!m || m.deleted_at) return { ok: false, error: "Message not found." };
  // Updates channel: admins pin anything, everyone else only their own posts.
  if (m.kind === "updates" && me.kind !== "admin" && m.sender_member_id !== me.memberId) return { ok: false, error: "Only admins can pin other people's updates." };
  const { error } = await db().from("agent_chat_messages")
    .update(pinned ? { pinned_at: new Date().toISOString(), pinned_by: me.memberId } : { pinned_at: null, pinned_by: null }).eq("id", m.id);
  return error ? { ok: false, error: "Could not update the pin." } : { ok: true };
}

export async function toggleReaction(me: ChatMe, messageId: unknown, emoji: unknown): Promise<ChatResult> {
  if (reactLimit(me.memberId)) return { ok: false, error: "Slow down a little." };
  if (!isAllowedReaction(emoji)) return { ok: false, error: "Unsupported reaction." };
  const m = await visibleMessage(me, messageId);
  if (!m || m.deleted_at) return { ok: false, error: "Message not found." };
  const { data } = await db().from("agent_chat_reactions").select("emoji").eq("message_id", m.id).eq("member_id", me.memberId).eq("emoji", emoji).maybeSingle();
  if (data) await db().from("agent_chat_reactions").delete().eq("message_id", m.id).eq("member_id", me.memberId).eq("emoji", emoji);
  else await db().from("agent_chat_reactions").insert({ message_id: m.id, member_id: me.memberId, emoji });
  return { ok: true };
}

export async function setTyping(me: ChatMe, conversationId: string): Promise<ChatResult> {
  if (typingLimit(me.memberId)) return { ok: true };
  const conv = await conversationFor(me, conversationId);
  if (!conv) return { ok: false, error: "Conversation not found." };
  await db().from("agent_chat_typing").upsert({ conversation_id: conv.id, member_id: me.memberId, typed_at: new Date().toISOString() }, { onConflict: "conversation_id,member_id" });
  return { ok: true };
}

export interface SearchHit {
  messageId: string;
  conversationId: string;
  title: string;
  senderName: string;
  preview: string;
  createdAt: string;
}

/** Search only conversations I am in (plus Updates). */
export async function searchMessages(me: ChatMe, raw: unknown): Promise<ChatResult<SearchHit[]>> {
  const q = cleanChatBody(raw).slice(0, 100);
  if (q.length < 2) return { ok: true, value: [] };
  if (searchLimit(me.memberId)) return { ok: false, error: "Too many searches. Wait a moment." };
  const { data: mine } = await db().from("agent_chat_participants").select("conversation_id").eq("member_id", me.memberId);
  const convIds = ((mine ?? []) as Array<{ conversation_id: string }>).map((r) => r.conversation_id);
  if (!convIds.length) return { ok: true, value: [] };
  const [{ data: rows }, { data: convs }, { data: parts }, { data: names }] = await Promise.all([
    db().from("agent_chat_messages").select("id, conversation_id, sender_member_id, body, created_at")
      .in("conversation_id", convIds).is("deleted_at", null).ilike("body", likePattern(q)).order("created_at", { ascending: false }).limit(50),
    db().from("agent_chat_conversations").select("id, kind").in("id", convIds),
    db().from("agent_chat_participants").select("conversation_id, member_id").in("conversation_id", convIds).neq("member_id", me.memberId),
    db().from("chat_members").select("id, display_name"),
  ]);
  const nameById = new Map(((names ?? []) as Array<{ id: string; display_name: string }>).map((n) => [n.id, n.display_name]));
  const kindById = new Map(((convs ?? []) as Array<{ id: string; kind: string }>).map((c) => [c.id, c.kind]));
  const peerByConv = new Map(((parts ?? []) as Array<{ conversation_id: string; member_id: string }>).map((p) => [p.conversation_id, p.member_id]));
  return {
    ok: true,
    value: ((rows ?? []) as Array<{ id: string; conversation_id: string; sender_member_id: string; body: string; created_at: string }>).map((r) => ({
      messageId: r.id,
      conversationId: r.conversation_id,
      title: kindById.get(r.conversation_id) === "updates" ? "Updates" : nameById.get(peerByConv.get(r.conversation_id) ?? "") ?? "Conversation",
      senderName: r.sender_member_id === me.memberId ? "You" : nameById.get(r.sender_member_id) ?? "Someone",
      preview: r.body.replace(/\s+/g, " ").slice(0, 140),
      createdAt: r.created_at,
    })),
  };
}

// ---------------------------------------------------------------- files

export async function createChatUpload(me: ChatMe, conversationId: string, file: { name?: unknown; size?: unknown }): Promise<ChatResult<{ path: string; token: string; mimeType: string }>> {
  if (uploadLimit(me.memberId)) return { ok: false, error: "Too many uploads. Wait a few minutes." };
  const conv = await conversationFor(me, conversationId);
  if (!conv) return { ok: false, error: "Conversation not found." };
  const check = validateChatFile({ name: String(file.name ?? ""), size: Number(file.size ?? 0) });
  if (!check.ok) return check;
  const path = `${conv.id}/${me.memberId}/${randomUUID()}-${check.fileName}`;
  const { data, error } = await db().storage.from(CHAT_FILES_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Could not start the upload." };
  return { ok: true, value: { path, token: data.token, mimeType: check.mimeType } };
}

async function verifyUpload(me: ChatMe, conversationId: string, path: string): Promise<ChatResult<Record<string, unknown>>> {
  const prefix = `${conversationId}/${me.memberId}/`;
  if (!path.startsWith(prefix) || path.includes("..")) return { ok: false, error: "Invalid upload." };
  const name = path.slice(prefix.length);
  const { data: listed } = await db().storage.from(CHAT_FILES_BUCKET).list(`${conversationId}/${me.memberId}`, { search: name, limit: 5 });
  const obj = (listed ?? []).find((o) => o.name === name);
  const size = Number((obj?.metadata as { size?: number } | undefined)?.size ?? 0);
  const check = validateChatFile({ name: name.replace(/^[0-9a-f-]{36}-/, ""), size });
  if (!obj || !check.ok) {
    if (obj) await db().storage.from(CHAT_FILES_BUCKET).remove([path]);
    return { ok: false, error: check.ok ? "Upload not found." : check.error };
  }
  return { ok: true, value: { file_path: path, file_name: check.fileName, file_mime: check.mimeType, file_size: size } };
}

// ---------------------------------------------------------------- prefs

export async function getChatOnLogin(agentId: string): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const { data } = await db().from("agent_admins").select("chat_on_login").eq("id", agentId).maybeSingle();
  return (data as { chat_on_login?: boolean } | null)?.chat_on_login !== false;
}

export async function setChatOnLogin(me: ChatMe, value: boolean): Promise<ChatResult> {
  if (!me.agentId) return { ok: false, error: "Only agents have this setting." };
  const { error } = await db().from("agent_admins").update({ chat_on_login: value }).eq("id", me.agentId);
  return error ? { ok: false, error: "Could not save the setting." } : { ok: true };
}
