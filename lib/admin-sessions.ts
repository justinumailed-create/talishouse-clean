import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "./supabaseAdmin";
import { ADMIN_ACTIVITY_MAX_AGE } from "./admin-idle";

/**
 * Server-side sessions for FAST-code admins (Global Admin + granted admins),
 * table `admin_sessions` (migration 112). The `admin_session` cookie holds only
 * a random 32-byte token; the DB stores its SHA-256 hash, the role/scope and
 * (for granted admins) the `admin_access_grants.id` — never a FAST Code.
 * Service role only. Agent Admins use `agent_admin_sessions` instead.
 */
export const ADMIN_SESSIONS_TABLE = "admin_sessions";

/** Absolute lifetime of an admin session. */
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24;

/** last_seen_at older than this → rejected (closed / sleeping tab dies server-side). */
export const ADMIN_SESSION_IDLE_MAX_MS = ADMIN_ACTIVITY_MAX_AGE * 1000;

/** Don't rewrite last_seen_at more than once per this window. */
const LAST_SEEN_WRITE_THROTTLE_MS = 5_000;

export type AdminSessionAccess = "global" | "granted";

export type AdminSessionRow = {
  id: string;
  access: AdminSessionAccess;
  grant_id: string | null;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  revoked_at: string | null;
};

export type AdminSessionRejection = "revoked" | "expired" | "idle";

const SESSION_COLUMNS = "id, access, grant_id, created_at, last_seen_at, expires_at, revoked_at";

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

/** 32 random bytes, base64url → exactly 43 chars. */
export function isAdminSessionTokenShape(value: string | null | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9_-]{43}$/.test(value));
}

export function hashAdminSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Pure check: why a stored session must be refused (null = still valid). */
export function adminSessionRejection(
  row: Pick<AdminSessionRow, "revoked_at" | "expires_at" | "last_seen_at">,
  nowMs: number = Date.now(),
): AdminSessionRejection | null {
  if (row.revoked_at) return "revoked";
  const expires = Date.parse(row.expires_at);
  if (!Number.isFinite(expires) || expires <= nowMs) return "expired";
  const lastSeen = Date.parse(row.last_seen_at);
  if (!Number.isFinite(lastSeen) || nowMs - lastSeen > ADMIN_SESSION_IDLE_MAX_MS) return "idle";
  return null;
}

/** After the FAST Code check passed: mint a token, store only its hash. */
export async function createAdminSession(input: {
  access: AdminSessionAccess;
  grantId: string | null;
}): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null;
  if (input.access === "granted" && !input.grantId) return null;
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const { error } = await db()
    .from(ADMIN_SESSIONS_TABLE)
    .insert({
      token_hash: hashAdminSessionToken(token),
      access: input.access,
      grant_id: input.access === "granted" ? input.grantId : null,
      created_at: new Date(now).toISOString(),
      last_seen_at: new Date(now).toISOString(),
      expires_at: new Date(now + ADMIN_SESSION_TTL_SECONDS * 1000).toISOString(),
    });
  if (error) return null;
  return token;
}

/**
 * Look up a cookie token: rejects malformed, unknown, revoked, expired and
 * idle (> ~90s since last_seen_at) sessions; refreshes last_seen_at otherwise.
 * Fails closed on any DB error.
 */
export async function resolveAdminSessionToken(
  token: string | null | undefined,
): Promise<AdminSessionRow | null> {
  if (!isAdminSessionTokenShape(token) || !isSupabaseAdminConfigured()) return null;
  try {
    const tokenHash = hashAdminSessionToken(token);
    const { data, error } = await db()
      .from(ADMIN_SESSIONS_TABLE)
      .select(SESSION_COLUMNS)
      .eq("token_hash", tokenHash)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as AdminSessionRow;
    const now = Date.now();
    const rejection = adminSessionRejection(row, now);
    if (rejection) {
      if (rejection !== "revoked") {
        await db()
          .from(ADMIN_SESSIONS_TABLE)
          .update({ revoked_at: new Date(now).toISOString() })
          .eq("id", row.id)
          .is("revoked_at", null);
      }
      return null;
    }
    if (now - Date.parse(row.last_seen_at) >= LAST_SEEN_WRITE_THROTTLE_MS) {
      const seen = new Date(now).toISOString();
      await db().from(ADMIN_SESSIONS_TABLE).update({ last_seen_at: seen }).eq("id", row.id).is("revoked_at", null);
      row.last_seen_at = seen;
    }
    return row;
  } catch {
    return null;
  }
}

/** Normal + idle logout: revoke this session row server-side. */
export async function revokeAdminSessionToken(token: string | null | undefined): Promise<void> {
  if (!isAdminSessionTokenShape(token) || !isSupabaseAdminConfigured()) return;
  await db()
    .from(ADMIN_SESSIONS_TABLE)
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", hashAdminSessionToken(token))
    .is("revoked_at", null);
}

/** Revoke every active FAST-code admin session (optionally keep the caller's). Returns the count. */
export async function revokeAllAdminSessions(options: { keepToken?: string | null } = {}): Promise<number> {
  if (!isSupabaseAdminConfigured()) return 0;
  let q = db()
    .from(ADMIN_SESSIONS_TABLE)
    .update({ revoked_at: new Date().toISOString() })
    .is("revoked_at", null);
  if (isAdminSessionTokenShape(options.keepToken)) {
    q = q.neq("token_hash", hashAdminSessionToken(options.keepToken));
  }
  const { data, error } = await q.select("id");
  if (error) throw new Error(error.message);
  return (data as unknown[] | null)?.length ?? 0;
}

/** Granted admin lost access: end all of that grant's sessions. */
export async function revokeAdminSessionsForGrant(grantId: string): Promise<void> {
  if (!grantId || !isSupabaseAdminConfigured()) return;
  await db()
    .from(ADMIN_SESSIONS_TABLE)
    .update({ revoked_at: new Date().toISOString() })
    .eq("grant_id", grantId)
    .is("revoked_at", null);
}
