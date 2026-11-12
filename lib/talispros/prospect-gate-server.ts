import "server-only";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { signCookieValue, verifyCookieValue } from "@/lib/talispros/mapsite-contract-service";
import { getAdminSessionAccount, matchesGlobalAdminPassword } from "@/lib/admin-auth";
import { getActiveAdminGrant } from "@/lib/admin-access-grants";
import { normalizeAgentCode } from "@/lib/talispros/mapsite-contract";
import { normalizeSlotFastCode } from "@/lib/talispros/fast-code-slots";

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

/** Verify the password against every active agent with a password. */
export async function verifyProspectGate(rawCode: unknown, rawPassword: unknown, href: string): Promise<GateResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "failed" };
  const code = normalizeSlotFastCode(rawCode);
  const password = typeof rawPassword === "string" ? rawPassword : "";
  if (!code || !password || password.length > 200) return { ok: false, error: "wrong" };

  const ip = await ipHash();
  const since = new Date(Date.now() - GATE_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count } = await db()
    .from("fast_code_gate_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ip)
    .eq("ok", false)
    .gte("created_at", since);
  if ((count ?? 0) >= GATE_MAX_FAILURES) return { ok: false, error: "limited" };

  const { data } = await db()
    .from("agent_admins")
    .select("id, password_hash")
    .eq("status", "active")
    .not("password_hash", "is", null);
  const rows = (data ?? []) as { id: string; password_hash: string | null }[];
  let matched: string | null = null;
  for (const row of rows) {
    if (row.password_hash && (await bcrypt.compare(password, row.password_hash))) {
      matched = row.id;
      break;
    }
  }
  if (!matched) {
    const agentCode = normalizeAgentCode(password);
    if (agentCode) {
      const { data: coded } = await db()
        .from("agent_admins")
        .select("id")
        .eq("status", "active")
        .eq("contract_code", agentCode)
        .maybeSingle();
      const codedRow = coded as { id: string } | null;
      if (codedRow?.id) matched = codedRow.id;
    }
  }
  if (!matched && (await matchesGlobalAdminPassword(password))) {
    matched = "global-admin";
  }
  if (!matched) {
    const grant = await getActiveAdminGrant(password);
    if (grant) matched = `grant:${grant.id}`;
  }
  await db().from("fast_code_gate_attempts").insert({ ip_hash: ip, ok: Boolean(matched) });
  if (!matched) return { ok: false, error: "wrong" };

  const jar = await cookies();
  jar.set(PROSPECT_GATE_COOKIE, signCookieValue(GATE_SCOPE, matched, GATE_TTL_SECONDS), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GATE_TTL_SECONDS,
  });
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
