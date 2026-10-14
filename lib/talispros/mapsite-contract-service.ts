import "server-only";
import { createHash, createHmac, randomInt, timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  CONTRACT_CODE_ALPHABET,
  CONTRACT_CODE_LENGTH,
  clampContractDays,
  isContractCodeShape,
  normalizeContractCode,
} from "@/lib/talispros/mapsite-contract";

/** Server-only Mapsite contract storage (migration 107). */

export const CONTRACT_COOKIE_PREFIX = "mapsite_contract_";
export const CONTRACT_COOKIE_MAX_AGE = 60 * 60 * 6; // 6 hours
export const CONTRACT_BUCKET = "mapsite-contracts";
const FAILED_LIMIT = 10;
const FAILED_WINDOW_MINUTES = 15;

export const CONTRACT_MIGRATION_HINT =
  "Contract storage is not ready. Apply supabase/migrations/107_mapsite_card_fields_contracts.sql.";

function db(): SupabaseClient {
  // Tables from migration 107 are not in the generated Database types yet.
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

function secret(): string {
  return (
    process.env.MAPSITE_CONTRACT_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "mapsite-contract-dev"
  );
}

export function hashContractCode(code: string): string {
  return createHash("sha256").update(`mapsite-contract:${normalizeContractCode(code)}`).digest("hex");
}

export function generateContractCode(): string {
  let out = "";
  for (let i = 0; i < CONTRACT_CODE_LENGTH; i += 1) {
    out += CONTRACT_CODE_ALPHABET[randomInt(CONTRACT_CODE_ALPHABET.length)];
  }
  return out;
}

export function contractCookieName(fastCode: string): string {
  return `${CONTRACT_COOKIE_PREFIX}${fastCode.trim().toLowerCase().replace(/[^a-z0-9]/g, "")}`;
}

/** Cookie value `${codeId}.${expiresMs}.${hmac}` bound to the FAST Code. */
export function signContractCookie(fastCode: string, codeId: string): string {
  const exp = Date.now() + CONTRACT_COOKIE_MAX_AGE * 1000;
  const payload = `${codeId}.${exp}`;
  const mac = createHmac("sha256", secret())
    .update(`${fastCode.trim().toLowerCase()}|${payload}`)
    .digest("hex");
  return `${payload}.${mac}`;
}

export function verifyContractCookie(
  fastCode: string,
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [codeId, exp, mac] = parts as [string, string, string];
  if (!/^[0-9a-f-]{36}$/i.test(codeId) || !(Number(exp) > Date.now())) return null;
  const expected = createHmac("sha256", secret())
    .update(`${fastCode.trim().toLowerCase()}|${codeId}.${exp}`)
    .digest("hex");
  const a = Buffer.from(mac, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return codeId;
}

export async function logContractEvent(entry: {
  fastCode: string;
  event: "generated" | "unlocked" | "failed" | "revoked" | "signed";
  codeId?: string | null;
  actor?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  try {
    await db().from("mapsite_contract_access_log").insert({
      fast_code: entry.fastCode.trim().toLowerCase(),
      event: entry.event,
      code_id: entry.codeId ?? null,
      actor: entry.actor?.slice(0, 200) ?? null,
      ip: entry.ip?.slice(0, 64) ?? null,
      user_agent: entry.userAgent?.slice(0, 300) ?? null,
    });
  } catch (error) {
    console.error("[mapsite-contract] log failed:", error);
  }
}

export type ContractCodeSummary = {
  id: string;
  fastCode: string;
  codeHint: string;
  label: string | null;
  createdBy: string;
  expiresAt: string;
  maxUses: number;
  useCount: number;
  revokedAt: string | null;
  createdAt: string;
};

type CodeRow = {
  id: string;
  fast_code: string;
  code_hint: string;
  label: string | null;
  created_by: string;
  created_by_agent_id: string | null;
  expires_at: string;
  max_uses: number;
  use_count: number;
  revoked_at: string | null;
  created_at: string;
};

function toSummary(row: CodeRow): ContractCodeSummary {
  return {
    id: row.id,
    fastCode: row.fast_code,
    codeHint: row.code_hint,
    label: row.label,
    createdBy: row.created_by,
    expiresAt: row.expires_at,
    maxUses: row.max_uses,
    useCount: row.use_count,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };
}

export async function createContractAccessCode(input: {
  fastCode: string;
  label?: string | null;
  days?: number;
  actor: string;
  agentId?: string | null;
}): Promise<{ code: string; summary: ContractCodeSummary } | { error: string }> {
  if (!isSupabaseAdminConfigured()) return { error: "Database is not configured." };
  const fastCode = input.fastCode.trim().toLowerCase();
  const days = clampContractDays(input.days);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = generateContractCode();
    const { data, error } = await db()
      .from("mapsite_contract_access_codes")
      .insert({
        fast_code: fastCode,
        code_hash: hashContractCode(code),
        code_hint: `…${code.slice(-3)}`,
        label: input.label?.trim().slice(0, 120) || null,
        created_by: input.actor.slice(0, 200),
        created_by_agent_id: input.agentId ?? null,
        expires_at: new Date(Date.now() + days * 86_400_000).toISOString(),
      })
      .select("*")
      .maybeSingle();
    if (error) {
      if (/duplicate|unique/i.test(error.message)) continue;
      console.error("[mapsite-contract] create code failed:", error.message);
      return {
        error: /relation|does not exist|schema cache/i.test(error.message)
          ? CONTRACT_MIGRATION_HINT
          : "Could not create the code.",
      };
    }
    const summary = toSummary(data as CodeRow);
    await logContractEvent({ fastCode, event: "generated", codeId: summary.id, actor: input.actor });
    return { code, summary };
  }
  return { error: "Could not create the code." };
}

export async function listContractAccessCodes(opts: {
  agentId?: string | null;
  limit?: number;
}): Promise<ContractCodeSummary[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    let query = db()
      .from("mapsite_contract_access_codes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(opts.limit ?? 25);
    if (opts.agentId) query = query.eq("created_by_agent_id", opts.agentId);
    const { data, error } = await query;
    if (error || !data) return [];
    return (data as CodeRow[]).map(toSummary);
  } catch {
    return [];
  }
}

export async function revokeContractAccessCode(input: {
  id: string;
  actor: string;
  agentId?: string | null;
}): Promise<{ ok: true } | { error: string }> {
  if (!isSupabaseAdminConfigured()) return { error: "Database is not configured." };
  let query = db()
    .from("mapsite_contract_access_codes")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", input.id)
    .is("revoked_at", null);
  if (input.agentId) query = query.eq("created_by_agent_id", input.agentId);
  const { data, error } = await query.select("id, fast_code").maybeSingle();
  if (error || !data) return { error: "Code not found." };
  await logContractEvent({
    fastCode: (data as { fast_code: string }).fast_code,
    event: "revoked",
    codeId: input.id,
    actor: input.actor,
  });
  return { ok: true };
}

async function recentFailures(ip: string | null): Promise<number> {
  if (!ip) return 0;
  const since = new Date(Date.now() - FAILED_WINDOW_MINUTES * 60_000).toISOString();
  const { count } = await db()
    .from("mapsite_contract_access_log")
    .select("id", { count: "exact", head: true })
    .eq("event", "failed")
    .eq("ip", ip)
    .gte("created_at", since);
  return count ?? 0;
}

/** Check a visitor's code for this FAST Code; logs success / failure. */
export async function redeemContractAccessCode(input: {
  fastCode: string;
  code: string;
  ip: string | null;
  userAgent: string | null;
}): Promise<{ codeId: string } | { error: "badCode" | "tooMany" | "notReady" }> {
  if (!isSupabaseAdminConfigured()) return { error: "notReady" };
  const fastCode = input.fastCode.trim().toLowerCase();
  if ((await recentFailures(input.ip)) >= FAILED_LIMIT) return { error: "tooMany" };
  const fail = async () => {
    await logContractEvent({ fastCode, event: "failed", ip: input.ip, userAgent: input.userAgent });
    return { error: "badCode" as const };
  };
  if (!isContractCodeShape(input.code)) return fail();
  const { data, error } = await db()
    .from("mapsite_contract_access_codes")
    .select("*")
    .eq("code_hash", hashContractCode(input.code))
    .maybeSingle();
  if (error || !data) return fail();
  const row = data as CodeRow;
  if (
    row.fast_code.trim().toLowerCase() !== fastCode ||
    row.revoked_at ||
    new Date(row.expires_at).getTime() < Date.now() ||
    row.use_count >= row.max_uses
  ) {
    return fail();
  }
  await db()
    .from("mapsite_contract_access_codes")
    .update({ use_count: row.use_count + 1 })
    .eq("id", row.id);
  await logContractEvent({
    fastCode,
    event: "unlocked",
    codeId: row.id,
    ip: input.ip,
    userAgent: input.userAgent,
  });
  return { codeId: row.id };
}

/** Code still valid (not revoked / expired) — re-checked on every page load. */
export async function isContractCodeActive(codeId: string, fastCode: string): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const { data } = await db()
    .from("mapsite_contract_access_codes")
    .select("id, fast_code, revoked_at, expires_at")
    .eq("id", codeId)
    .maybeSingle();
  const row = data as Pick<CodeRow, "id" | "fast_code" | "revoked_at" | "expires_at"> | null;
  return Boolean(
    row &&
      row.fast_code.trim().toLowerCase() === fastCode.trim().toLowerCase() &&
      !row.revoked_at &&
      new Date(row.expires_at).getTime() > Date.now(),
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Store the signed record (DB row + self-contained HTML record in private storage). */
export async function recordMapSiteContractSignature(input: {
  mapsiteId: string | null;
  fastCode: string;
  codeId: string;
  signerName: string;
  signerEmail: string | null;
  signatureType: "typed" | "drawn";
  signatureText: string | null;
  signatureImage: string | null;
  contractText: string;
  locale: string;
  ip: string | null;
  userAgent: string | null;
}): Promise<{ id: string } | { error: string }> {
  if (!isSupabaseAdminConfigured()) return { error: "Database is not configured." };
  const fastCode = input.fastCode.trim().toLowerCase();
  const sha = createHash("sha256").update(input.contractText).digest("hex");
  const signedAt = new Date().toISOString();
  const { data, error } = await db()
    .from("mapsite_contract_signatures")
    .insert({
      mapsite_id: input.mapsiteId,
      fast_code: fastCode,
      code_id: input.codeId,
      signer_name: input.signerName,
      signer_email: input.signerEmail,
      signature_type: input.signatureType,
      signature_text: input.signatureText,
      signature_image: input.signatureImage,
      contract_text: input.contractText,
      contract_sha256: sha,
      locale: input.locale,
      ip: input.ip,
      user_agent: input.userAgent?.slice(0, 300) ?? null,
      provider: "in-app",
      signed_at: signedAt,
    })
    .select("id")
    .maybeSingle();
  if (error || !data) {
    console.error("[mapsite-contract] sign failed:", error?.message);
    return {
      error: /relation|does not exist|schema cache/i.test(error?.message || "")
        ? CONTRACT_MIGRATION_HINT
        : "Could not save the signature.",
    };
  }
  const id = (data as { id: string }).id;

  const signatureHtml =
    input.signatureType === "drawn" && input.signatureImage
      ? `<img alt="Signature" src="${input.signatureImage}" style="max-height:120px">`
      : `<p style="font-family:cursive;font-size:28px">${escapeHtml(input.signatureText || "")}</p>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Signed Mapsite contract ${escapeHtml(
    fastCode.toUpperCase(),
  )}</title></head><body style="font-family:system-ui;max-width:760px;margin:32px auto;line-height:1.5">
<h1>Signed Mapsite contract — FAST Code ${escapeHtml(fastCode.toUpperCase())}</h1>
<pre style="white-space:pre-wrap;font-family:inherit;border:1px solid #ddd;padding:16px">${escapeHtml(input.contractText)}</pre>
<h2>Signature</h2>${signatureHtml}
<table style="font-size:13px">
<tr><td>Signer</td><td>${escapeHtml(input.signerName)}</td></tr>
<tr><td>Email</td><td>${escapeHtml(input.signerEmail || "—")}</td></tr>
<tr><td>Signed at (UTC)</td><td>${signedAt}</td></tr>
<tr><td>IP</td><td>${escapeHtml(input.ip || "—")}</td></tr>
<tr><td>User agent</td><td>${escapeHtml(input.userAgent || "—")}</td></tr>
<tr><td>Contract SHA-256</td><td><code>${sha}</code></td></tr>
<tr><td>Record id</td><td><code>${id}</code></td></tr>
<tr><td>Provider</td><td>Talispros in-app e-signature</td></tr>
</table></body></html>`;
  const path = `${fastCode}/${signedAt.slice(0, 10)}/${id}.html`;
  try {
    const { error: uploadError } = await db()
      .storage.from(CONTRACT_BUCKET)
      .upload(path, Buffer.from(html, "utf8"), { contentType: "text/html", upsert: false });
    if (!uploadError) {
      await db().from("mapsite_contract_signatures").update({ record_path: path }).eq("id", id);
    } else {
      console.error("[mapsite-contract] record upload failed:", uploadError.message);
    }
  } catch (uploadError) {
    console.error("[mapsite-contract] record upload failed:", uploadError);
  }
  await logContractEvent({
    fastCode,
    event: "signed",
    codeId: input.codeId,
    actor: input.signerName,
    ip: input.ip,
    userAgent: input.userAgent,
  });
  return { id };
}
