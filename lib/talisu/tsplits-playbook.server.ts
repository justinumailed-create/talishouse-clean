import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  TSPLITS_PLAYBOOK_COOKIE,
  TSPLITS_PLAYBOOK_COOKIE_MAX_AGE,
  TSPLITS_PLAYBOOK_FAILED_LIMIT,
  TSPLITS_PLAYBOOK_FAILED_WINDOW_MINUTES,
  type TsplitsPlaybookUnlockError,
} from "@/lib/talisu/tsplits-playbook";

/**
 * Server-side gate for the Tsplits™ Sales Playbook.
 * - Passcode comes only from TSPLITS_PLAYBOOK_PASSCODE; unset → always locked.
 * - Comparison is constant-time (SHA-256 digests + timingSafeEqual).
 * - The access cookie is HMAC-signed with a key derived from the passcode, so
 *   changing the passcode invalidates every earlier cookie.
 * - Failures are rate-limited per IP (10 per 15 min), logged to the same
 *   access log the Register entry codes use.
 * - The HTML / PDF live in private/tsplits/ (bundled via
 *   outputFileTracingIncludes), never in public/.
 */

export const TSPLITS_PLAYBOOK_ENV = "TSPLITS_PLAYBOOK_PASSCODE";
const LOG_SCOPE = "tsplits-playbook";
const COOKIE_VERSION = "v1";
const PRIVATE_DIR = join(process.cwd(), "private", "tsplits");
export const TSPLITS_PLAYBOOK_HTML_FILE = join(PRIVATE_DIR, "tsplits-sales-playbook.html");
export const TSPLITS_PLAYBOOK_PDF_FILE = join(PRIVATE_DIR, "Tsplits-Sales-Playbook.pdf");

export const TSPLITS_PLAYBOOK_PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

function configuredPasscode(): string | null {
  const value = process.env[TSPLITS_PLAYBOOK_ENV]?.trim();
  return value ? value : null;
}

export function isTsplitsPlaybookConfigured(): boolean {
  return configuredPasscode() !== null;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/** Constant-time passcode check; always false when the env var is unset. */
export function isTsplitsPlaybookPasscode(candidate: unknown): boolean {
  const expected = configuredPasscode();
  const given = typeof candidate === "string" ? candidate.trim() : "";
  const match = timingSafeEqual(digest(given), digest(expected ?? "\u0000unset"));
  return Boolean(expected) && given.length > 0 && match;
}

function cookieKey(passcode: string): Buffer {
  return createHmac("sha256", passcode)
    .update(`${LOG_SCOPE}|cookie|${COOKIE_VERSION}|${process.env.ADMIN_SESSION_SECRET ?? ""}`)
    .digest();
}

function cookieMac(passcode: string, exp: string): string {
  return createHmac("sha256", cookieKey(passcode))
    .update(`${LOG_SCOPE}|${COOKIE_VERSION}|${exp}`)
    .digest("hex");
}

/** `v1.<expMs>.<hmac>`; null when no passcode is configured. */
export function signTsplitsPlaybookCookie(now = Date.now()): string | null {
  const passcode = configuredPasscode();
  if (!passcode) return null;
  const exp = String(now + TSPLITS_PLAYBOOK_COOKIE_MAX_AGE * 1000);
  return `${COOKIE_VERSION}.${exp}.${cookieMac(passcode, exp)}`;
}

export function verifyTsplitsPlaybookCookie(
  value: string | null | undefined,
  now = Date.now(),
): boolean {
  const passcode = configuredPasscode();
  if (!passcode || !value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [version, exp, mac] = parts as [string, string, string];
  if (version !== COOKIE_VERSION || !/^\d{10,16}$/.test(exp) || !/^[0-9a-f]{64}$/.test(mac)) {
    return false;
  }
  const expMs = Number(exp);
  if (!(expMs > now) || expMs > now + TSPLITS_PLAYBOOK_COOKIE_MAX_AGE * 1000 + 60_000) return false;
  const a = Buffer.from(mac, "hex");
  const b = Buffer.from(cookieMac(passcode, exp), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

type CookieReader = { get(name: string): { value: string } | undefined };

export function hasTsplitsPlaybookAccess(cookies: CookieReader): boolean {
  return verifyTsplitsPlaybookCookie(cookies.get(TSPLITS_PLAYBOOK_COOKIE)?.value);
}

export function tsplitsPlaybookCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: TSPLITS_PLAYBOOK_COOKIE_MAX_AGE,
  };
}

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

async function recentFailures(ip: string | null): Promise<number> {
  if (!ip || !isSupabaseAdminConfigured()) return 0;
  const since = new Date(Date.now() - TSPLITS_PLAYBOOK_FAILED_WINDOW_MINUTES * 60_000).toISOString();
  try {
    const { count } = await db()
      .from("mapsite_contract_access_log")
      .select("id", { count: "exact", head: true })
      .eq("event", "failed")
      .eq("fast_code", LOG_SCOPE)
      .eq("ip", ip)
      .gte("created_at", since);
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function logEvent(event: "failed" | "unlocked", ip: string | null, userAgent: string | null) {
  if (!isSupabaseAdminConfigured()) return;
  try {
    await db().from("mapsite_contract_access_log").insert({
      fast_code: LOG_SCOPE,
      event,
      actor: LOG_SCOPE,
      ip: ip?.slice(0, 64) ?? null,
      user_agent: userAgent?.slice(0, 300) ?? null,
    });
  } catch (error) {
    console.error("[tsplits-playbook] log failed:", error instanceof Error ? error.message : "unknown");
  }
}

/** Passcode attempt → signed cookie value, or a neutral error. */
export async function redeemTsplitsPlaybookPasscode(input: {
  passcode: unknown;
  ip: string | null;
  userAgent: string | null;
}): Promise<{ cookie: string } | { error: TsplitsPlaybookUnlockError }> {
  if (!isTsplitsPlaybookConfigured()) return { error: "unavailable" };
  if ((await recentFailures(input.ip)) >= TSPLITS_PLAYBOOK_FAILED_LIMIT) return { error: "tooMany" };
  if (!isTsplitsPlaybookPasscode(input.passcode)) {
    await logEvent("failed", input.ip, input.userAgent);
    return { error: "badCode" };
  }
  const cookie = signTsplitsPlaybookCookie();
  if (!cookie) return { error: "unavailable" };
  await logEvent("unlocked", input.ip, input.userAgent);
  return { cookie };
}

export function requestIp(headers: Headers): string | null {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim() || null;
}

export function readTsplitsPlaybookHtml(): Promise<string> {
  return readFile(TSPLITS_PLAYBOOK_HTML_FILE, "utf8");
}

export function readTsplitsPlaybookPdf(): Promise<Buffer> {
  return readFile(TSPLITS_PLAYBOOK_PDF_FILE);
}
