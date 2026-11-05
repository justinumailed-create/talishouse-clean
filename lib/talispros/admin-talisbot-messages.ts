import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
export type {
  AdminTalisbotComment,
  AdminTalisbotMessage,
  Locale,
  LocalizedCopy,
  TalisbotCommentStatus,
  TalisbotMessageType,
} from "@/lib/talispros/admin-talisbot-messages-types";
export { TALISBOT_MESSAGE_TYPES } from "@/lib/talispros/admin-talisbot-messages-types";
export { groupMessagesByIstDay, localizedMessage } from "@/lib/talispros/admin-talisbot-messages-shared";
import type {
  AdminTalisbotComment,
  AdminTalisbotMessage,
  LocalizedCopy,
  TalisbotCommentStatus,
  TalisbotMessageType,
} from "@/lib/talispros/admin-talisbot-messages-types";
import { TALISBOT_MESSAGE_TYPES } from "@/lib/talispros/admin-talisbot-messages-types";

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
}

function mapMessage(r: Record<string, unknown>): AdminTalisbotMessage {
  const type = String(r.type);
  return {
    id: String(r.id),
    type: (TALISBOT_MESSAGE_TYPES as readonly string[]).includes(type)
      ? (type as TalisbotMessageType)
      : "progress",
    title: String(r.title),
    body: String(r.body),
    fastCode: (r.fast_code as string | null) ?? null,
    brokerage: (r.brokerage as string | null) ?? null,
    prospectQueueId: (r.prospect_queue_id as string | null) ?? null,
    metadata: asRecord(r.metadata),
    createdBy: String(r.created_by ?? "talisbot"),
    parentId: (r.parent_id as string | null) ?? null,
    replyToCommentId: (r.reply_to_comment_id as string | null) ?? null,
    readAt: (r.read_at as string | null) ?? null,
    createdAt: String(r.created_at),
  };
}

function mapComment(r: Record<string, unknown>): AdminTalisbotComment {
  const status = String(r.status);
  return {
    id: String(r.id),
    messageId: (r.message_id as string | null) ?? null,
    body: String(r.body),
    author: String(r.author),
    createdAt: String(r.created_at),
    status: status === "seen" || status === "answered" ? status : "new",
    answeredAt: (r.answered_at as string | null) ?? null,
  };
}

export async function listAdminTalisbotMessages(filter: {
  day?: string;
  type?: TalisbotMessageType;
  limit?: number;
} = {}): Promise<AdminTalisbotMessage[]> {
  if (!isSupabaseAdminConfigured()) return [];
  let q = db()
    .from("admin_talisbot_messages")
    .select(
      "id, type, title, body, fast_code, brokerage, prospect_queue_id, metadata, created_by, parent_id, reply_to_comment_id, read_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(filter.limit ?? 200);
  if (filter.type) q = q.eq("type", filter.type);
  if (filter.day && /^\d{4}-\d{2}-\d{2}$/.test(filter.day)) {
    const start = new Date(Date.parse(`${filter.day}T00:00:00.000Z`) - 330 * 60 * 1000).toISOString();
    const end = new Date(Date.parse(start) + 24 * 60 * 60 * 1000).toISOString();
    q = q.gte("created_at", start).lt("created_at", end);
  }
  const { data } = await q;
  return ((data ?? []) as Record<string, unknown>[]).map(mapMessage);
}

export async function listAdminTalisbotComments(filter: {
  messageId?: string;
  status?: TalisbotCommentStatus;
  limit?: number;
} = {}): Promise<AdminTalisbotComment[]> {
  if (!isSupabaseAdminConfigured()) return [];
  let q = db()
    .from("admin_talisbot_comments")
    .select("id, message_id, body, author, created_at, status, answered_at")
    .order("created_at", { ascending: true })
    .limit(filter.limit ?? 500);
  if (filter.messageId) q = q.eq("message_id", filter.messageId);
  if (filter.status) q = q.eq("status", filter.status);
  const { data } = await q;
  return ((data ?? []) as Record<string, unknown>[]).map(mapComment);
}

export async function insertAdminTalisbotMessage(input: {
  type: TalisbotMessageType;
  title: string;
  body: string;
  fastCode?: string | null;
  brokerage?: string | null;
  prospectQueueId?: string | null;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  parentId?: string | null;
  replyToCommentId?: string | null;
  i18n?: LocalizedCopy;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "database not configured" };
  const metadata = { ...(input.metadata ?? {}) };
  if (input.i18n) metadata.i18n = input.i18n;
  const { data, error } = await db()
    .from("admin_talisbot_messages")
    .insert({
      type: input.type,
      title: (input.i18n?.en.title ?? input.title).trim().slice(0, 200),
      body: (input.i18n?.en.body ?? input.body).trim().slice(0, 4000),
      fast_code: input.fastCode ? input.fastCode.toLowerCase() : null,
      brokerage: input.brokerage?.trim() || null,
      prospect_queue_id: input.prospectQueueId ?? null,
      metadata,
      created_by: input.createdBy ?? "talisbot",
      parent_id: input.parentId ?? null,
      reply_to_comment_id: input.replyToCommentId ?? null,
    })
    .select("id")
    .single();
  if (error || !data?.id) return { ok: false, error: error?.message || "insert failed" };
  return { ok: true, id: String((data as { id: string }).id) };
}

export async function markAdminTalisbotMessageRead(id: string): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const { error } = await db()
    .from("admin_talisbot_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  return !error;
}

export async function insertAdminTalisbotComment(input: {
  body: string;
  author: string;
  messageId?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "database not configured" };
  const { data, error } = await db()
    .from("admin_talisbot_comments")
    .insert({
      body: input.body.trim().slice(0, 4000),
      author: input.author.trim().slice(0, 120),
      message_id: input.messageId ?? null,
      status: "new",
    })
    .select("id")
    .single();
  if (error || !data?.id) return { ok: false, error: error?.message || "insert failed" };
  return { ok: true, id: String((data as { id: string }).id) };
}

export async function markAdminTalisbotCommentAnswered(id: string): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const { error } = await db()
    .from("admin_talisbot_comments")
    .update({ status: "answered", answered_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

/** True when a daily/Run-now job row is still open (searching). */
export async function isTalisbotSearching(): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const { data } = await db()
    .from("fast_code_job_runs")
    .select("id, started_at")
    .is("finished_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return false;
  // Ignore stuck runs older than 30 minutes.
  const started = Date.parse(String((data as { started_at: string }).started_at));
  return Number.isFinite(started) && Date.now() - started < 30 * 60 * 1000;
}

/** Post a progress/result/assigned card addressed to Ralf (EN + DE in metadata.i18n). */
export async function postTalisbotCard(input: {
  type: TalisbotMessageType;
  i18n: LocalizedCopy;
  fastCode?: string | null;
  brokerage?: string | null;
  prospectQueueId?: string | null;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  parentId?: string | null;
  replyToCommentId?: string | null;
}): Promise<void> {
  await insertAdminTalisbotMessage({
    type: input.type,
    title: input.i18n.en.title,
    body: input.i18n.en.body,
    i18n: input.i18n,
    fastCode: input.fastCode,
    brokerage: input.brokerage,
    prospectQueueId: input.prospectQueueId,
    metadata: input.metadata,
    createdBy: input.createdBy ?? "talisbot",
    parentId: input.parentId,
    replyToCommentId: input.replyToCommentId,
  });
}

export function progressCopy(towns: string[]): LocalizedCopy {
  const list = towns.length ? towns.join(", ") : "—";
  return {
    en: {
      title: "Searching markets…",
      body: `Hi Ralf — TalisBOT™ just started a sourcing run. Checking: ${list}.`,
    },
    de: {
      title: "Märkte werden durchsucht …",
      body: `Hallo Ralf — TalisBOT™ hat einen Recherche-Lauf gestartet. Prüfe: ${list}.`,
    },
  };
}

export function resultCopy(added: number, markets: string[]): LocalizedCopy {
  const m = markets.length ? markets.join("; ") : "—";
  return {
    en: {
      title: "Sourcing run finished",
      body: `Hi Ralf — run complete. ${added} new brokerage${added === 1 ? "" : "s"} added. Markets: ${m}.`,
    },
    de: {
      title: "Recherche-Lauf fertig",
      body: `Hallo Ralf — Lauf abgeschlossen. ${added} neue${added === 1 ? "s" : ""} Maklerbüro${added === 1 ? "" : "s"} hinzugefügt. Märkte: ${m}.`,
    },
  };
}

export function contactResultCopy(names: string[], codes: string[]): LocalizedCopy {
  const n = names.filter(Boolean);
  const c = codes.filter(Boolean).map((x) => x.toUpperCase());
  return {
    en: {
      title: "Decision makers saved",
      body: `Hi Ralf — decision maker${n.length === 1 ? "" : "s"} found${n.length ? `: ${n.join(", ")}` : ""}. ${
        c.length ? `Codes ready: ${c.join(", ")}.` : "Code pending where a name still needs review."
      }`,
    },
    de: {
      title: "Entscheider gespeichert",
      body: `Hallo Ralf — Entscheider gefunden${n.length ? `: ${n.join(", ")}` : ""}. ${
        c.length ? `Codes bereit: ${c.join(", ")}.` : "Code ausstehend, wo der Name noch geprüft werden muss."
      }`,
    },
  };
}

export function assignedCopy(rows: { code: string; agent: string; brokerage: string }[]): LocalizedCopy {
  const lines = rows.map((r) => `${r.code.toUpperCase()} → ${r.agent} (${r.brokerage})`).join("\n");
  return {
    en: {
      title: "Codes assigned",
      body: `Hi Ralf — approved prospects were assigned:\n${lines || "—"}`,
    },
    de: {
      title: "Codes zugewiesen",
      body: `Hallo Ralf — freigegebene Interessenten wurden zugewiesen:\n${lines || "—"}`,
    },
  };
}
