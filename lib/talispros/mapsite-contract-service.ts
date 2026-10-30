import "server-only";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { normalizeAgentCode } from "@/lib/talispros/mapsite-contract";

/** Server-only PMC contract storage (migrations 107 + 108). */

export const CONTRACT_AGENT_COOKIE = "talis_contract_agent";
export const CONTRACT_SIGNED_COOKIE = "talis_contract_signed";
export const CONTRACT_AGENT_COOKIE_MAX_AGE = 60 * 60 * 12; // 12 hours
export const CONTRACT_SIGNED_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days
export const CONTRACT_BUCKET = "mapsite-contracts";
const FAILED_LIMIT = 10;
const FAILED_WINDOW_MINUTES = 15;

export const CONTRACT_MIGRATION_HINT =
  "Contract storage is not ready. Apply supabase/migrations/108_agent_contract_codes.sql.";

function db(): SupabaseClient {
  // Tables / columns from migrations 107–108 are not in the generated types yet.
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

/** `${id}.${expMs}.${hmac(scope|id|exp)}` */
export function signCookieValue(scope: string, id: string, maxAgeSeconds: number): string {
  const exp = Date.now() + maxAgeSeconds * 1000;
  const mac = createHmac("sha256", secret()).update(`${scope}|${id}|${exp}`).digest("hex");
  return `${id}.${exp}.${mac}`;
}

export function verifyCookieValue(scope: string, value: string | null | undefined): string | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [id, exp, mac] = parts as [string, string, string];
  if (!/^[0-9a-f-]{36}$/i.test(id) || !(Number(exp) > Date.now())) return null;
  const expected = createHmac("sha256", secret()).update(`${scope}|${id}|${exp}`).digest("hex");
  const a = Buffer.from(mac, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}

export async function logContractEvent(entry: {
  fastCode?: string | null;
  event: "unlocked" | "failed" | "signed";
  agentId?: string | null;
  actor?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  try {
    await db().from("mapsite_contract_access_log").insert({
      fast_code: entry.fastCode?.trim().toLowerCase() || "-",
      event: entry.event,
      agent_id: entry.agentId ?? null,
      actor: entry.actor?.slice(0, 200) ?? null,
      ip: entry.ip?.slice(0, 64) ?? null,
      user_agent: entry.userAgent?.slice(0, 300) ?? null,
    });
  } catch (error) {
    console.error("[pmc-contract] log failed:", error);
  }
}

export type ContractAgent = { id: string; name: string; code: string };

export async function getContractAgentById(id: string): Promise<ContractAgent | null> {
  if (!isSupabaseAdminConfigured() || !id) return null;
  const { data } = await db()
    .from("agent_admins")
    .select("id, name, contract_code, status")
    .eq("id", id)
    .maybeSingle();
  const row = data as { id: string; name: string; contract_code: string | null; status: string } | null;
  if (!row || row.status !== "active" || !row.contract_code) return null;
  return { id: row.id, name: row.name, code: row.contract_code };
}

/** Agent's permanent code (created by migration 108 / insert trigger). */
export async function getAgentContractCode(agentId: string): Promise<string | null> {
  if (!isSupabaseAdminConfigured() || !agentId) return null;
  const { data, error } = await db()
    .from("agent_admins")
    .select("contract_code")
    .eq("id", agentId)
    .maybeSingle();
  if (error) return null;
  return (data as { contract_code: string | null } | null)?.contract_code ?? null;
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

/** Visitor enters their agent's code; logs success / failure. */
export async function redeemAgentContractCode(input: {
  code: string;
  fastCode?: string | null;
  ip: string | null;
  userAgent: string | null;
}): Promise<{ agent: ContractAgent } | { error: "badCode" | "tooMany" | "notReady" }> {
  if (!isSupabaseAdminConfigured()) return { error: "notReady" };
  if ((await recentFailures(input.ip)) >= FAILED_LIMIT) return { error: "tooMany" };
  const code = normalizeAgentCode(input.code);
  const fail = async () => {
    await logContractEvent({ fastCode: input.fastCode, event: "failed", ip: input.ip, userAgent: input.userAgent });
    return { error: "badCode" as const };
  };
  if (!code) return fail();
  const { data } = await db()
    .from("agent_admins")
    .select("id, name, contract_code, status")
    .eq("contract_code", code)
    .maybeSingle();
  const row = data as { id: string; name: string; contract_code: string; status: string } | null;
  if (!row || row.status !== "active") return fail();
  await logContractEvent({
    fastCode: input.fastCode,
    event: "unlocked",
    agentId: row.id,
    ip: input.ip,
    userAgent: input.userAgent,
  });
  return { agent: { id: row.id, name: row.name, code: row.contract_code } };
}

export type SignedContractSummary = {
  id: string;
  fastCode: string | null;
  signerName: string;
  signerBusiness: string | null;
  signerEmail: string | null;
  agentId: string | null;
  agentName: string | null;
  agentCode: string | null;
  signedAt: string;
  recordPath: string | null;
};

type SigRow = {
  id: string;
  fast_code: string | null;
  signer_name: string;
  signer_business: string | null;
  signer_email: string | null;
  agent_id: string | null;
  agent_code: string | null;
  signed_at: string;
  record_path: string | null;
  agent?: { name: string | null } | null;
};

const SIG_COLUMNS =
  "id, fast_code, signer_name, signer_business, signer_email, agent_id, agent_code, signed_at, record_path, agent:agent_admins(name)";

function toSummary(row: SigRow): SignedContractSummary {
  return {
    id: row.id,
    fastCode: row.fast_code,
    signerName: row.signer_name,
    signerBusiness: row.signer_business,
    signerEmail: row.signer_email,
    agentId: row.agent_id,
    agentName: row.agent?.name ?? null,
    agentCode: row.agent_code,
    signedAt: row.signed_at,
    recordPath: row.record_path,
  };
}

export async function listSignedContracts(opts: {
  agentId?: string | null;
  limit?: number;
} = {}): Promise<SignedContractSummary[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    let q = db()
      .from("mapsite_contract_signatures")
      .select(SIG_COLUMNS)
      .eq("document", "service-agreement")
      .order("signed_at", { ascending: false })
      .limit(opts.limit ?? 200);
    if (opts.agentId) q = q.eq("agent_id", opts.agentId);
    const { data, error } = await q;
    if (error || !data) return [];
    return (data as unknown as SigRow[]).map(toSummary);
  } catch {
    return [];
  }
}

export async function getSignedContractById(id: string): Promise<SignedContractSummary | null> {
  if (!isSupabaseAdminConfigured() || !id) return null;
  const { data } = await db().from("mapsite_contract_signatures").select(SIG_COLUMNS).eq("id", id).maybeSingle();
  return data ? toSummary(data as unknown as SigRow) : null;
}

/** Latest signed Service Agreement for a FAST Code (registration gate + CRM). */
export async function getSignedContractForFastCode(
  fastCode: string | null | undefined,
): Promise<SignedContractSummary | null> {
  const code = fastCode?.trim().toLowerCase() || "";
  if (!code || !isSupabaseAdminConfigured()) return null;
  try {
    const { data, error } = await db()
      .from("mapsite_contract_signatures")
      .select(SIG_COLUMNS)
      .eq("document", "service-agreement")
      .ilike("fast_code", code)
      .order("signed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return toSummary(data as unknown as SigRow);
  } catch {
    return null;
  }
}

/** FAST Code → agent attribution map (for CRM / admin tables). */
export async function contractAgentsByFastCode(): Promise<Map<string, SignedContractSummary>> {
  const rows = await listSignedContracts({ limit: 1000 });
  const map = new Map<string, SignedContractSummary>();
  for (const row of rows) {
    const key = row.fastCode?.trim().toLowerCase();
    if (key && !map.has(key)) map.set(key, row);
  }
  return map;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Store the signed record (DB row + self-contained HTML record in private storage). */
export async function recordServiceAgreementSignature(input: {
  mapsiteId: string | null;
  fastCode: string | null;
  agent: ContractAgent;
  signerName: string;
  signerBusiness: string | null;
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
  const fastCode = input.fastCode?.trim().toLowerCase() || null;
  const sha = createHash("sha256").update(input.contractText).digest("hex");
  const signedAt = new Date().toISOString();
  const { data, error } = await db()
    .from("mapsite_contract_signatures")
    .insert({
      mapsite_id: input.mapsiteId,
      fast_code: fastCode,
      agent_id: input.agent.id,
      agent_code: input.agent.code,
      signer_name: input.signerName,
      signer_business: input.signerBusiness,
      signer_email: input.signerEmail,
      signature_type: input.signatureType,
      signature_text: input.signatureText,
      signature_image: input.signatureImage,
      contract_text: input.contractText,
      contract_sha256: sha,
      document: "service-agreement",
      locale: input.locale,
      ip: input.ip,
      user_agent: input.userAgent?.slice(0, 300) ?? null,
      provider: "in-app",
      signed_at: signedAt,
    })
    .select("id")
    .maybeSingle();
  if (error || !data) {
    console.error("[pmc-contract] sign failed:", error?.message);
    return {
      error: /relation|does not exist|schema cache|column/i.test(error?.message || "")
        ? CONTRACT_MIGRATION_HINT
        : "Could not save the signature.",
    };
  }
  const id = (data as { id: string }).id;
  const signatureHtml =
    input.signatureType === "drawn" && input.signatureImage
      ? `<img alt="Signature" src="${input.signatureImage}" style="max-height:120px">`
      : `<p style="font-family:cursive;font-size:28px">${escapeHtml(input.signatureText || "")}</p>`;
  const rows: Array<[string, string]> = [
    ["Business", input.signerBusiness || "—"],
    ["Authorized Representative", input.signerName],
    ["Email", input.signerEmail || "—"],
    ["FAST Code", fastCode?.toUpperCase() || "—"],
    ["Agent", `${input.agent.name} (${input.agent.code})`],
    ["Signed at (UTC)", signedAt],
    ["IP", input.ip || "—"],
    ["User agent", input.userAgent || "—"],
    ["Agreement SHA-256", sha],
    ["Record id", id],
    ["Provider", "Tsplits™ in-app e-signature"],
  ];
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Signed Service Agreement ${escapeHtml(
    fastCode?.toUpperCase() || id,
  )}</title></head><body style="font-family:system-ui;max-width:760px;margin:32px auto;line-height:1.5">
<h1>Signed Service Agreement — TalisALL PMC</h1>
<pre style="white-space:pre-wrap;font-family:inherit;border:1px solid #ddd;padding:16px">${escapeHtml(input.contractText)}</pre>
<h2>Customer signature</h2>${signatureHtml}
<table style="font-size:13px">${rows
    .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`)
    .join("")}</table></body></html>`;
  const path = `service-agreement/${signedAt.slice(0, 10)}/${id}.html`;
  try {
    const { error: uploadError } = await db()
      .storage.from(CONTRACT_BUCKET)
      .upload(path, Buffer.from(html, "utf8"), { contentType: "text/html", upsert: false });
    if (!uploadError) {
      await db().from("mapsite_contract_signatures").update({ record_path: path }).eq("id", id);
    } else {
      console.error("[pmc-contract] record upload failed:", uploadError.message);
    }
  } catch (uploadError) {
    console.error("[pmc-contract] record upload failed:", uploadError);
  }
  await logContractEvent({
    fastCode,
    event: "signed",
    agentId: input.agent.id,
    actor: input.signerName,
    ip: input.ip,
    userAgent: input.userAgent,
  });
  return { id };
}
