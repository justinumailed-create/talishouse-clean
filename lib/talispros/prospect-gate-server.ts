import "server-only";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { signCookieValue, verifyCookieValue } from "@/lib/talispros/mapsite-contract-service";
import { getAdminSessionAccount, matchesGlobalAdminPassword, writeAdminSessionCookie } from "@/lib/admin-auth";
import { getActiveAdminGrant } from "@/lib/admin-access-grants";
import { normalizeAgentCode } from "@/lib/talispros/mapsite-contract";
import { normalizeSlotFastCode } from "@/lib/talispros/fast-code-slots";
import { isCheckoutAgentCode, normalizeCheckoutAgentCode } from "@/lib/talisu/checkout-codes";
import {
  CHECKOUT_CODE_COOKIE,
  CHECKOUT_CODE_GRANT_ID,
  CHECKOUT_CODE_MAX_AGE,
  CHECKOUT_CODE_SCOPE,
  REGISTER_ENTRY_COOKIE,
  REGISTER_ENTRY_COOKIE_MAX_AGE,
  REGISTER_ENTRY_COOKIE_SCOPE,
} from "@/lib/talisu/register-entry";

/**
 * Agent gate for prospect Mapsites (Arun, Nov 5). A prepared FAST Code opens
 * after an active agent's password or permanent agent code, or after a
 * superadmin credential (global admin password, or an active admin-access
 * grant). The match is stored as a short-lived signed cookie. Wrong guesses
 * never lock an agent's own login; they are rate-limited per IP instead.
 *
 * Superadmins were rejected before this: the gate compared only
 * agent_admins.password_hash. Ralf is a granted admin and also has an agent
 * row, but the page asked for a password and did not accept his agent code
 * or his admin sign-in. Arun, the owner, signs in as the global admin, which
 * this gate also ignored.
 */

export const PROSPECT_GATE_COOKIE = "talis_prospect_gate";
const GATE_SCOPE = "prospect-gate";
const GATE_TTL_SECONDS = 8 * 60 * 60;
export const GATE_MAX_FAILURES = 8;
export const GATE_WINDOW_MINUTES = 15;

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

async function ipHash(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown";
  return createHash("sha256").update(`gate|${ip}`).digest("hex").slice(0, 40);
}

/** Agent id of a valid gate cookie, or null. */
export async function readProspectGateAgentId(): Promise<string | null> {
  const jar = await cookies();
  return verifyCookieValue(GATE_SCOPE, jar.get(PROSPECT_GATE_COOKIE)?.value);
}

/** Gate cookie, or a signed-in admin/agent session, opens prospect Mapsites. */
export async function hasProspectAccess(): Promise<boolean> {
  if (await readProspectGateAgentId()) return true;
  const account = await getAdminSessionAccount().catch(() => null);
  return Boolean(account);
}

export type GateResult = { ok: true; href: string } | { ok: false; error: "wrong" | "limited" | "failed" };

export type GateError = "wrong" | "limited" | "failed";

/** Cookie ids that verifyCookieValue will accept (agent UUIDs). */
const AGENT_ID = /^[0-9a-f-]{36}$/i;

async function failureCount(): Promise<number> {
  const ip = await ipHash();
  const since = new Date(Date.now() - GATE_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count } = await db()
    .from("fast_code_gate_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ip)
    .eq("ok", false)
    .gte("created_at", since);
  return count ?? 0;
}

async function recordGateAttempt(ok: boolean): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  await db().from("fast_code_gate_attempts").insert({ ip_hash: await ipHash(), ok });
}

/**
 * Same secret the Demo Mapsite gate accepts: an active agent's password, that
 * agent's permanent code, the Global Admin password, or an admin grant.
 * Returns an agent id, "global-admin", or "grant:<id>". Never logs the secret.
 */
export async function matchAgentGateSecret(password: string): Promise<string | null> {
  if (!isSupabaseAdminConfigured() || !password || password.length > 200) return null;
  const { data } = await db()
    .from("agent_admins")
    .select("id, password_hash")
    .eq("status", "active")
    .not("password_hash", "is", null);
  const rows = (data ?? []) as { id: string; password_hash: string | null }[];
  for (const row of rows) {
    if (row.password_hash && (await bcrypt.compare(password, row.password_hash))) {
      return row.id;
    }
  }
  const agentCode = normalizeAgentCode(password);
  if (agentCode) {
    const { data: coded } = await db()
      .from("agent_admins")
      .select("id")
      .eq("status", "active")
      .eq("contract_code", agentCode)
      .maybeSingle();
    const codedRow = coded as { id: string } | null;
    if (codedRow?.id) return codedRow.id;
  }
  if (await matchesGlobalAdminPassword(password)) return "global-admin";
  const grant = await getActiveAdminGrant(password);
  if (grant) return `grant:${grant.id}`;
  return null;
}

/**
 * Remember a successful match. Agent ids use the signed cookies (the cookie
 * signer only accepts UUID ids). Global Admin and grants open a real admin
 * session — the same session as /admin/login — because those ids cannot be
 * stored in the UUID cookie.
 */
async function persistAgentGateMatch(password: string, matched: string): Promise<boolean> {
  if (matched === "global-admin" || matched.startsWith("grant:")) {
    const account = await writeAdminSessionCookie(password).catch(() => null);
    return Boolean(account);
  }
  if (!AGENT_ID.test(matched)) return false;
  const jar = await cookies();
  const cookie = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  jar.set(PROSPECT_GATE_COOKIE, signCookieValue(GATE_SCOPE, matched, GATE_TTL_SECONDS), {
    ...cookie,
    maxAge: GATE_TTL_SECONDS,
  });
  jar.set(
    REGISTER_ENTRY_COOKIE,
    signCookieValue(REGISTER_ENTRY_COOKIE_SCOPE, matched, REGISTER_ENTRY_COOKIE_MAX_AGE),
    { ...cookie, maxAge: REGISTER_ENTRY_COOKIE_MAX_AGE },
  );
  return true;
}

async function acceptSecret(password: string): Promise<{ ok: true } | { ok: false; error: GateError }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "failed" };
  if (!password || password.length > 200) return { ok: false, error: "wrong" };
  if ((await failureCount()) >= GATE_MAX_FAILURES) return { ok: false, error: "limited" };
  let matched: string | null = null;
  try {
    matched = await matchAgentGateSecret(password);
  } catch {
    return { ok: false, error: "failed" };
  }
  if (!matched) {
    await recordGateAttempt(false);
    return { ok: false, error: "wrong" };
  }
  const saved = await persistAgentGateMatch(password, matched);
  await recordGateAttempt(saved);
  return saved ? { ok: true } : { ok: false, error: "failed" };
}

/**
 * Register checkout codes. Only the memorable allowlist (case-insensitive,
 * trimmed). The Demo Mapsite gate still uses acceptSecret / matchAgentGateSecret.
 */
export async function acceptAgentGateSecret(raw: unknown): Promise<{ ok: true } | { ok: false; error: GateError }> {
  const code = normalizeCheckoutAgentCode(raw);
  if (!code || code.length > 200) return { ok: false, error: "wrong" };
  if (isSupabaseAdminConfigured() && (await failureCount()) >= GATE_MAX_FAILURES) {
    return { ok: false, error: "limited" };
  }
  if (!isCheckoutAgentCode(code)) {
    if (isSupabaseAdminConfigured()) await recordGateAttempt(false);
    return { ok: false, error: "wrong" };
  }
  const jar = await cookies();
  jar.set(CHECKOUT_CODE_COOKIE, signCookieValue(CHECKOUT_CODE_SCOPE, CHECKOUT_CODE_GRANT_ID, CHECKOUT_CODE_MAX_AGE), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CHECKOUT_CODE_MAX_AGE,
  });
  if (isSupabaseAdminConfigured()) await recordGateAttempt(true);
  return { ok: true };
}

/**
 * Markets maps: existing Global Admin password or an existing admin grant.
 * A match creates the admin session, so the map is a second door into Global Admin.
 * Agent passwords are not accepted here.
 */
export async function acceptGlobalAdminPassword(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: GateError }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "failed" };
  const password = typeof raw === "string" ? raw.trim() : "";
  if (!password || password.length > 200) return { ok: false, error: "wrong" };
  if ((await failureCount()) >= GATE_MAX_FAILURES) return { ok: false, error: "limited" };
  const account = await writeAdminSessionCookie(password).catch(() => null);
  await recordGateAttempt(Boolean(account));
  return account ? { ok: true } : { ok: false, error: "wrong" };
}

/** Verify the password against every active agent with a password. */
export async function verifyProspectGate(rawCode: unknown, rawPassword: unknown, href: string): Promise<GateResult> {
  const code = normalizeSlotFastCode(rawCode);
  const password = typeof rawPassword === "string" ? rawPassword : "";
  if (!code || !password || password.length > 200) return { ok: false, error: "wrong" };
  const accepted = await acceptSecret(password);
  if (!accepted.ok) return accepted;
  return { ok: true, href };
}

/** Redirect to the gate when `code` is a prospect FAST Code and there is no agent access. */
export async function requireProspectAccessForCode(code: string | null | undefined): Promise<void> {
  const value = normalizeSlotFastCode(code ?? "");
  if (!value) return;
  const { resolvePreparedHrefByCode } = await import("@/lib/talispros/fast-code-slots-server");
  if (!(await resolvePreparedHrefByCode(value))) return;
  if (await hasProspectAccess()) return;
  const { redirect } = await import("next/navigation");
  redirect(`/talispros/demo-mapsite?gate=${encodeURIComponent(value.toLowerCase())}#fast-code-slots`);
}
