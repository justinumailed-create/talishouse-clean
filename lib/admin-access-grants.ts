import { isRetiredAdminFastCode } from "./admin-retired-codes";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "./supabaseAdmin";
import { revokeAdminSessionsForGrant } from "./admin-sessions";
import {
  isGlobalAdminFastCode,
  normalizeAdminFastCode,
  sanitizeGrantPermissions,
  type AdminGrantPermission,
} from "./admin-constants";

/** Admin access grants (migration 104). Server-only, service role. */
export type AdminAccessGrant = {
  id: string;
  fastCode: string;
  displayName: string | null;
  email: string | null;
  permissions: AdminGrantPermission[];
  grantedBy: string;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
  revokedBy: string | null;
};

export type AdminAccessGrantEvent = {
  id: string;
  fastCode: string;
  action: "granted" | "updated" | "revoked";
  permissions: AdminGrantPermission[];
  actor: string;
  createdAt: string;
};

type GrantRow = {
  id: string;
  fast_code: string;
  display_name: string | null;
  email: string | null;
  permissions: string[] | null;
  granted_by: string;
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
};

const GRANT_COLUMNS =
  "id, fast_code, display_name, email, permissions, granted_by, created_at, updated_at, revoked_at, revoked_by";

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

function toGrant(row: GrantRow): AdminAccessGrant {
  return {
    id: row.id,
    fastCode: row.fast_code,
    displayName: row.display_name,
    email: row.email,
    permissions: sanitizeGrantPermissions(row.permissions),
    grantedBy: row.granted_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    revokedAt: row.revoked_at,
    revokedBy: row.revoked_by,
  };
}

/** FAST Codes that can never hold a grant (Global Admin, retired RETIRED-LEGACY-CODE). */
export function isGrantableAdminFastCode(code: string | null | undefined): boolean {
  const c = normalizeAdminFastCode(code);
  return Boolean(c) && /^[A-Z0-9-]{2,40}$/.test(c) && !isGlobalAdminFastCode(c) && !isRetiredAdminFastCode(c);
}

/** Active grant for a FAST Code, or null (also null on any DB error: fail closed). */
export async function getActiveAdminGrant(code: string | null | undefined): Promise<AdminAccessGrant | null> {
  const c = normalizeAdminFastCode(code);
  if (!isGrantableAdminFastCode(c) || !isSupabaseAdminConfigured()) return null;
  try {
    const { data, error } = await db()
      .from("admin_access_grants")
      .select(GRANT_COLUMNS)
      .eq("fast_code", c)
      .is("revoked_at", null)
      .maybeSingle();
    if (error || !data) return null;
    return toGrant(data as GrantRow);
  } catch {
    return null;
  }
}

/** Active grant by id (admin session lookups reference the grant, not the code). Fails closed. */
export async function getActiveAdminGrantById(id: string | null | undefined): Promise<AdminAccessGrant | null> {
  if (!id || !/^[0-9a-f-]{36}$/i.test(id) || !isSupabaseAdminConfigured()) return null;
  try {
    const { data, error } = await db()
      .from("admin_access_grants")
      .select(GRANT_COLUMNS)
      .eq("id", id)
      .is("revoked_at", null)
      .maybeSingle();
    if (error || !data) return null;
    const grant = toGrant(data as GrantRow);
    return isGrantableAdminFastCode(grant.fastCode) ? grant : null;
  } catch {
    return null;
  }
}

export async function listAdminGrants(): Promise<AdminAccessGrant[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const { data, error } = await db()
    .from("admin_access_grants")
    .select(GRANT_COLUMNS)
    .order("revoked_at", { ascending: false, nullsFirst: true })
    .order("created_at", { ascending: false });
  if (error) return [];
  return ((data || []) as GrantRow[]).map(toGrant);
}

export async function listAdminGrantEvents(limit = 50): Promise<AdminAccessGrantEvent[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const { data, error } = await db()
    .from("admin_access_grant_events")
    .select("id, fast_code, action, permissions, actor, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (
    (data || []) as Array<{
      id: string;
      fast_code: string;
      action: AdminAccessGrantEvent["action"];
      permissions: string[] | null;
      actor: string;
      created_at: string;
    }>
  ).map((r) => ({
    id: r.id,
    fastCode: r.fast_code,
    action: r.action,
    permissions: sanitizeGrantPermissions(r.permissions),
    actor: r.actor,
    createdAt: r.created_at,
  }));
}

async function logEvent(
  grantId: string | null,
  fastCode: string,
  action: AdminAccessGrantEvent["action"],
  permissions: readonly string[],
  actor: string,
) {
  await db().from("admin_access_grant_events").insert({
    grant_id: grantId,
    fast_code: fastCode,
    action,
    permissions,
    actor,
  });
}

type Result = { ok: true } | { ok: false; error: string };

export async function createAdminGrant(input: {
  fastCode: string;
  displayName?: string | null;
  email?: string | null;
  permissions: readonly string[];
  actor: string;
}): Promise<Result> {
  const fastCode = normalizeAdminFastCode(input.fastCode);
  if (!isGrantableAdminFastCode(fastCode)) {
    return { ok: false, error: "That FAST Code cannot be granted admin access." };
  }
  const permissions = sanitizeGrantPermissions(input.permissions);
  const { data, error } = await db()
    .from("admin_access_grants")
    .insert({
      fast_code: fastCode,
      display_name: input.displayName?.trim() || null,
      email: input.email?.trim() || null,
      permissions,
      granted_by: input.actor,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { ok: false, error: `${fastCode} already has active admin access.` };
    return { ok: false, error: error.message };
  }
  await logEvent((data as { id: string }).id, fastCode, "granted", permissions, input.actor);
  return { ok: true };
}

export async function updateAdminGrant(input: {
  id: string;
  displayName?: string | null;
  email?: string | null;
  permissions: readonly string[];
  actor: string;
}): Promise<Result> {
  const permissions = sanitizeGrantPermissions(input.permissions);
  const { data, error } = await db()
    .from("admin_access_grants")
    .update({
      display_name: input.displayName?.trim() || null,
      email: input.email?.trim() || null,
      permissions,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .is("revoked_at", null)
    .select("fast_code")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Grant not found or already revoked." };
  await logEvent(input.id, (data as { fast_code: string }).fast_code, "updated", permissions, input.actor);
  return { ok: true };
}

export async function revokeAdminGrant(id: string, actor: string): Promise<Result> {
  const now = new Date().toISOString();
  const { data, error } = await db()
    .from("admin_access_grants")
    .update({ revoked_at: now, revoked_by: actor, updated_at: now })
    .eq("id", id)
    .is("revoked_at", null)
    .select("fast_code, permissions")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Grant not found or already revoked." };
  const row = data as { fast_code: string; permissions: string[] | null };
  await logEvent(id, row.fast_code, "revoked", row.permissions ?? [], actor);
  await revokeAdminSessionsForGrant(id).catch(() => {});
  return { ok: true };
}
