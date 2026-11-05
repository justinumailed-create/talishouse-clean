import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";

export const TALISBOT_MESSAGE_TYPES = [
  "progress",
  "result",
  "assigned",
  "needs_review",
  "reply",
] as const;

export type TalisbotMessageType = (typeof TALISBOT_MESSAGE_TYPES)[number];

export type AdminTalisbotMessage = {
  id: string;
  type: TalisbotMessageType;
  title: string;
  body: string;
  fastCode: string | null;
  brokerage: string | null;
  prospectQueueId: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  parentId: string | null;
  readAt: string | null;
  createdAt: string;
};

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
}

function mapRow(r: Record<string, unknown>): AdminTalisbotMessage {
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
    readAt: (r.read_at as string | null) ?? null,
    createdAt: String(r.created_at),
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
      "id, type, title, body, fast_code, brokerage, prospect_queue_id, metadata, created_by, parent_id, read_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(filter.limit ?? 100);
  if (filter.type) q = q.eq("type", filter.type);
  if (filter.day && /^\d{4}-\d{2}-\d{2}$/.test(filter.day)) {
    // IST day window → UTC
    const start = new Date(Date.parse(`${filter.day}T00:00:00.000Z`) - 330 * 60 * 1000).toISOString();
    const end = new Date(Date.parse(start) + 24 * 60 * 60 * 1000).toISOString();
    q = q.gte("created_at", start).lt("created_at", end);
  }
  const { data } = await q;
  return ((data ?? []) as Record<string, unknown>[]).map(mapRow);
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
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "database not configured" };
  const { data, error } = await db()
    .from("admin_talisbot_messages")
    .insert({
      type: input.type,
      title: input.title.trim().slice(0, 200),
      body: input.body.trim().slice(0, 4000),
      fast_code: input.fastCode ? input.fastCode.toLowerCase() : null,
      brokerage: input.brokerage?.trim() || null,
      prospect_queue_id: input.prospectQueueId ?? null,
      metadata: input.metadata ?? {},
      created_by: input.createdBy ?? "talisbot",
      parent_id: input.parentId ?? null,
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
