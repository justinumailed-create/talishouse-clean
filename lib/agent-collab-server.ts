import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSessionAccount, readAgentSessionToken } from "./admin-auth";
import type { AdminAccount } from "./admin-constants";
import { hashToken, isAgentSessionTokenShape, logAgentAudit } from "./agent-admins";
import {
  AGENT_NOTE_MAX_CHARS,
  AGENT_NOTES_BUCKET,
  canEditNoteOn,
  istDate,
  isValidDateString,
  validateNoteFile,
} from "./agent-collab";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "./supabaseAdmin";

/**
 * Server-only data access for agent notes, presence, activity and chat.
 * All tables have RLS on with no client policies; only this service-role code
 * touches them, after checking the httpOnly agent_session.
 */

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

export type AgentAccount = AdminAccount & { agentId: string };

/** Signed-in, active agent who has finished the first-login password change. */
export async function getCurrentAgent(): Promise<AgentAccount | null> {
  const account = await getAdminSessionAccount();
  if (!account || account.access !== "agent" || !account.agentId || account.mustChangePassword) return null;
  return account as AgentAccount;
}

function actor(a: AgentAccount): string {
  return `${a.name} (${a.fastCode}) [agent:${a.agentId}]`;
}

// ---------------------------------------------------------------- presence

export interface AgentPresence {
  agentId: string;
  lastSeenAt: string | null;
  signedOutAt: string | null;
}

export async function touchAgentPresence(agentId: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  const now = new Date().toISOString();
  await db().from("agent_presence").upsert({ agent_id: agentId, last_seen_at: now }, { onConflict: "agent_id" });
  await db().from("chat_members").update({ last_seen_at: now }).eq("agent_id", agentId);
  const token = await readAgentSessionToken().catch(() => null);
  if (token && isAgentSessionTokenShape(token)) {
    await db().from("agent_admin_sessions").update({ last_seen_at: now }).eq("token_hash", hashToken(token));
  }
}

export async function markAgentSignedOut(agentId: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  await db()
    .from("agent_presence")
    .upsert({ agent_id: agentId, signed_out_at: new Date().toISOString() }, { onConflict: "agent_id" });
  await db().from("chat_members").update({ signed_out_at: new Date().toISOString() }).eq("agent_id", agentId);
}

export async function getAgentPresence(agentIds: readonly string[]): Promise<Map<string, AgentPresence>> {
  const map = new Map<string, AgentPresence>();
  if (!isSupabaseAdminConfigured() || agentIds.length === 0) return map;
  const { data } = await db()
    .from("agent_presence")
    .select("agent_id, last_seen_at, signed_out_at")
    .in("agent_id", [...agentIds]);
  for (const row of (data ?? []) as Array<{ agent_id: string; last_seen_at: string | null; signed_out_at: string | null }>) {
    map.set(row.agent_id, { agentId: row.agent_id, lastSeenAt: row.last_seen_at, signedOutAt: row.signed_out_at });
  }
  return map;
}

/**
 * Record session expiries that nobody observed (agent closed the tab): every
 * expired session row is logged once with its last activity, then deleted.
 */
export async function sweepExpiredAgentSessions(): Promise<number> {
  if (!isSupabaseAdminConfigured()) return 0;
  const { data } = await db()
    .from("agent_admin_sessions")
    .select("id, agent_id, created_at, last_seen_at, expires_at")
    .lte("expires_at", new Date().toISOString())
    .limit(200);
  const rows = (data ?? []) as Array<{ id: string; agent_id: string; created_at: string; last_seen_at: string; expires_at: string }>;
  for (const row of rows) {
    const { data: deleted } = await db().from("agent_admin_sessions").delete().eq("id", row.id).select("id");
    if (deleted && deleted.length > 0) {
      await logAgentAudit(row.agent_id, "agent.session.expired", "system", {
        signed_in_at: row.created_at,
        last_activity_at: row.last_seen_at,
        expired_at: row.expires_at,
      });
    }
  }
  return rows.length;
}

// ---------------------------------------------------------------- notes

export interface AgentNote {
  id: string;
  agentId: string;
  noteDate: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentNoteFile {
  id: string;
  agentId: string;
  noteDate: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  url: string | null;
}

type NoteRow = { id: string; agent_id: string; note_date: string; body: string; created_at: string; updated_at: string };
type FileRow = { id: string; agent_id: string; note_date: string; storage_path: string; file_name: string; mime_type: string; size_bytes: number; created_at: string };

const toNote = (r: NoteRow): AgentNote => ({
  id: r.id, agentId: r.agent_id, noteDate: r.note_date, body: r.body, createdAt: r.created_at, updatedAt: r.updated_at,
});

export async function listAgentNotes(filter: {
  agentId?: string | null;
  from?: string | null;
  to?: string | null;
  limit?: number;
}): Promise<AgentNote[]> {
  if (!isSupabaseAdminConfigured()) return [];
  let q = db().from("agent_daily_notes").select("id, agent_id, note_date, body, created_at, updated_at");
  if (filter.agentId) q = q.eq("agent_id", filter.agentId);
  if (isValidDateString(filter.from)) q = q.gte("note_date", filter.from);
  if (isValidDateString(filter.to)) q = q.lte("note_date", filter.to);
  const { data } = await q
    .order("note_date", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(filter.limit ?? 300);
  return ((data ?? []) as NoteRow[]).map(toNote);
}

export async function listAgentNoteFiles(filter: {
  agentId?: string | null;
  from?: string | null;
  to?: string | null;
}): Promise<AgentNoteFile[]> {
  if (!isSupabaseAdminConfigured()) return [];
  let q = db().from("agent_note_files").select("id, agent_id, note_date, storage_path, file_name, mime_type, size_bytes, created_at");
  if (filter.agentId) q = q.eq("agent_id", filter.agentId);
  if (isValidDateString(filter.from)) q = q.gte("note_date", filter.from);
  if (isValidDateString(filter.to)) q = q.lte("note_date", filter.to);
  const { data } = await q.order("created_at", { ascending: false }).limit(300);
  const rows = (data ?? []) as FileRow[];
  const urls = new Map<string, string>();
  if (rows.length > 0) {
    const { data: signed } = await db()
      .storage.from(AGENT_NOTES_BUCKET)
      .createSignedUrls(rows.map((r) => r.storage_path), 60 * 10);
    for (const s of signed ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }
  return rows.map((r) => ({
    id: r.id, agentId: r.agent_id, noteDate: r.note_date, fileName: r.file_name, mimeType: r.mime_type,
    sizeBytes: Number(r.size_bytes), createdAt: r.created_at, url: urls.get(r.storage_path) ?? null,
  }));
}

/** Dates (newest first) on which the agent has notes or files, for the history list. */
export async function listAgentNoteDates(agentId: string, limit = 30): Promise<string[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const [notes, files] = await Promise.all([
    db().from("agent_daily_notes").select("note_date").eq("agent_id", agentId).order("note_date", { ascending: false }).limit(500),
    db().from("agent_note_files").select("note_date").eq("agent_id", agentId).order("note_date", { ascending: false }).limit(500),
  ]);
  const set = new Set<string>();
  for (const r of [...(notes.data ?? []), ...(files.data ?? [])] as Array<{ note_date: string }>) set.add(r.note_date);
  return [...set].sort().reverse().slice(0, limit);
}

export type CollabResult<T = undefined> = { ok: true; value?: T } | { ok: false; error: string };

function cleanBody(body: string, max: number): string | null {
  const v = String(body ?? "").replace(/\r\n/g, "\n").trim();
  if (!v || v.length > max) return null;
  return v;
}

export async function createAgentNote(agent: AgentAccount, body: string): Promise<CollabResult> {
  const text = cleanBody(body, AGENT_NOTE_MAX_CHARS);
  if (!text) return { ok: false, error: `Write a note (up to ${AGENT_NOTE_MAX_CHARS} characters).` };
  const noteDate = istDate();
  const { data, error } = await db()
    .from("agent_daily_notes")
    .insert({ agent_id: agent.agentId, note_date: noteDate, body: text })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Could not save the note." };
  await logAgentAudit(agent.agentId, "agent.note.create", actor(agent), { note_date: noteDate, note_id: (data as { id: string }).id });
  return { ok: true };
}

export async function updateAgentNote(agent: AgentAccount, noteId: string, body: string): Promise<CollabResult> {
  const text = cleanBody(body, AGENT_NOTE_MAX_CHARS);
  if (!text) return { ok: false, error: `Write a note (up to ${AGENT_NOTE_MAX_CHARS} characters).` };
  const { data } = await db()
    .from("agent_daily_notes")
    .select("id, agent_id, note_date")
    .eq("id", noteId)
    .maybeSingle();
  const row = data as { id: string; agent_id: string; note_date: string } | null;
  if (!row || row.agent_id !== agent.agentId) return { ok: false, error: "Note not found." };
  if (!canEditNoteOn(row.note_date)) return { ok: false, error: "Notes can only be edited on the day they were written." };
  const { error } = await db()
    .from("agent_daily_notes")
    .update({ body: text, updated_at: new Date().toISOString() })
    .eq("id", noteId)
    .eq("agent_id", agent.agentId);
  if (error) return { ok: false, error: "Could not save the note." };
  await logAgentAudit(agent.agentId, "agent.note.update", actor(agent), { note_date: row.note_date, note_id: noteId });
  return { ok: true };
}

/** Step 1 of an upload: validate, then hand the browser a one-time signed upload URL. */
export async function createAgentNoteUpload(
  agent: AgentAccount,
  file: { name: string; size: number; type?: string | null },
): Promise<CollabResult<{ path: string; token: string; mimeType: string }>> {
  const check = validateNoteFile(file);
  if (!check.ok) return check;
  const path = `${agent.agentId}/${istDate()}/${randomUUID()}-${check.fileName}`;
  const { data, error } = await db().storage.from(AGENT_NOTES_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Could not start the upload." };
  return { ok: true, value: { path, token: data.token, mimeType: check.mimeType } };
}

/** Step 2: confirm the object exists in the agent's own folder for today, then record it. */
export async function confirmAgentNoteUpload(agent: AgentAccount, path: string): Promise<CollabResult> {
  const today = istDate();
  const prefix = `${agent.agentId}/${today}/`;
  if (typeof path !== "string" || !path.startsWith(prefix) || path.includes("..")) {
    return { ok: false, error: "Invalid upload." };
  }
  const name = path.slice(prefix.length);
  const { data: listed } = await db().storage.from(AGENT_NOTES_BUCKET).list(`${agent.agentId}/${today}`, { search: name, limit: 5 });
  const obj = (listed ?? []).find((o) => o.name === name);
  const size = Number((obj?.metadata as { size?: number } | undefined)?.size ?? 0);
  const check = validateNoteFile({ name: name.replace(/^[0-9a-f-]{36}-/, ""), size });
  if (!obj || !check.ok) {
    if (obj) await db().storage.from(AGENT_NOTES_BUCKET).remove([path]);
    return { ok: false, error: check.ok ? "Upload not found." : check.error };
  }
  const { error } = await db().from("agent_note_files").insert({
    agent_id: agent.agentId,
    note_date: today,
    storage_path: path,
    file_name: check.fileName,
    mime_type: check.mimeType,
    size_bytes: size,
  });
  if (error) return { ok: false, error: "Could not record the upload." };
  await logAgentAudit(agent.agentId, "agent.note.upload", actor(agent), {
    note_date: today, file_name: check.fileName, size_bytes: size,
  });
  return { ok: true };
}

// ---------------------------------------------------------------- activity

export interface AgentActivityEntry {
  id: string;
  agentId: string | null;
  action: string;
  performedBy: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export async function listAgentActivity(filter: {
  agentId?: string | null;
  action?: string | null;
  from?: string | null;
  to?: string | null;
  limit?: number;
}): Promise<AgentActivityEntry[]> {
  if (!isSupabaseAdminConfigured()) return [];
  let q = db()
    .from("activity_logs")
    .select("id, record_id, action, performed_by, details, created_at")
    .or("table_name.eq.agent_admins,table_name.eq.brokerage_leads");
  if (filter.agentId) q = q.eq("record_id", filter.agentId);
  if (filter.action) q = q.eq("action", filter.action);
  if (isValidDateString(filter.from)) q = q.gte("created_at", new Date(`${filter.from}T00:00:00+05:30`).toISOString());
  if (isValidDateString(filter.to)) {
    q = q.lt("created_at", new Date(new Date(`${filter.to}T00:00:00+05:30`).getTime() + 86400000).toISOString());
  }
  const { data } = await q.order("created_at", { ascending: false }).limit(filter.limit ?? 300);
  return ((data ?? []) as Array<{ id: string; record_id: string | null; action: string; performed_by: string | null; details: Record<string, unknown> | null; created_at: string }>).map((r) => ({
    id: r.id, agentId: r.record_id, action: r.action, performedBy: r.performed_by, details: r.details ?? {}, createdAt: r.created_at,
  }));
}
