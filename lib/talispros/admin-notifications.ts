import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";

export type AdminNotificationType = "mapsite_url_gate_code";

export type AdminNotificationRecord = {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type MapSiteUrlGateNotificationMetadata = {
  mapsiteId: string;
  fastCode: string;
  propertyTitle: string | null;
  code: string;
  expiresAt: string;
  source: "visitor" | "admin";
};

const STORAGE_ERROR =
  "Admin notifications storage is not available. Apply the mapsite URL gate notifications migration.";

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function mapRow(row: {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: unknown;
  read_at: string | null;
  created_at: string;
}): AdminNotificationRecord {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    metadata: asRecord(row.metadata),
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function createAdminNotification(input: {
  type: AdminNotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}): Promise<{ success: true; id: string } | { success: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: STORAGE_ERROR };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_notifications")
    .insert({
      type: input.type,
      title: input.title,
      body: input.body,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return { success: false, error: error?.message || STORAGE_ERROR };
  }

  return { success: true, id: data.id };
}

export async function listAdminNotifications(limit = 50): Promise<{
  notifications: AdminNotificationRecord[];
  error?: string;
}> {
  if (!isSupabaseAdminConfigured()) {
    return { notifications: [], error: STORAGE_ERROR };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_notifications")
    .select("id, type, title, body, metadata, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(limit, 200)));

  if (error) {
    return { notifications: [], error: error.message || STORAGE_ERROR };
  }

  return {
    notifications: (data ?? []).map(mapRow),
  };
}

export async function markAdminNotificationRead(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: STORAGE_ERROR };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("admin_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);

  if (error) {
    return { success: false, error: error.message || STORAGE_ERROR };
  }

  return { success: true };
}

export function urlGateCodeFromNotification(
  notification: AdminNotificationRecord,
): string | null {
  if (notification.type !== "mapsite_url_gate_code") return null;
  const code = notification.metadata.code;
  return typeof code === "string" && /^\d{6}$/.test(code) ? code : null;
}
