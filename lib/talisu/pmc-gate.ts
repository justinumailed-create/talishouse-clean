import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  getMapSiteOwnerSession,
  getRegisteredMapSiteFastCode,
  isMapSiteAdmin,
} from "@/lib/mapsite-edit-auth";
import { isDemoMapSiteCode, DEMO_MAPSITE_BUILD_PATH } from "@/lib/talispros/demo-mapsite";
import { isIssuedFastCode } from "@/lib/talispros/fast-code-shape";
import { hasCompletedMapSiteActivationPayment } from "@/lib/talispros/mapsite-payment";
import {
  CONTRACT_SIGNED_COOKIE,
  getSignedContractById,
  getSignedContractForFastCode,
  verifyCookieValue,
} from "@/lib/talispros/mapsite-contract-service";
import { PMC_PATHS, normalizeFastCodeParam, pmcHref } from "@/lib/talispros/mapsite-contract";

/**
 * Registration gate (Arun, 2026-10-14) — every registrant, every entry point:
 *   Demo → claim Mapsite (FAST Code) → Tsplits™ → Media Directory →
 *   Contract (agent code) → sign → Aisha Register → payment.
 * Paid Mapsites and Mapsite admins are never gated.
 */

export const PMC_CLAIM_START = DEMO_MAPSITE_BUILD_PATH;

export type ClaimedMapSite = { id: string; fastCode: string };

/** A real (issued, non-demo) claimed Mapsite for this FAST Code. */
export async function findClaimedMapSite(fastCode: string | null | undefined): Promise<ClaimedMapSite | null> {
  const code = normalizeFastCodeParam(fastCode);
  if (!code || !isIssuedFastCode(code) || isDemoMapSiteCode(code) || !isSupabaseAdminConfigured()) return null;
  const { data } = await getSupabaseAdmin()
    .from("mapsites")
    .select("id, fast_code, is_demonstration")
    .ilike("fast_code", code)
    .limit(1)
    .maybeSingle();
  const row = data as { id: string; fast_code: string | null; is_demonstration: boolean | null } | null;
  if (!row?.id || row.is_demonstration || isDemoMapSiteCode(row.fast_code)) return null;
  return { id: row.id, fastCode: (row.fast_code || code).toLowerCase() };
}

/** FAST Code of this visitor's claimed Mapsite: explicit param → signed cookie → owner session. */
export async function resolveVisitorFastCode(param?: string | null): Promise<string | null> {
  const explicit = normalizeFastCodeParam(param);
  if (explicit) return explicit;
  const signedId = verifyCookieValue("signed", (await cookies()).get(CONTRACT_SIGNED_COOKIE)?.value);
  if (signedId) {
    const signed = await getSignedContractById(signedId);
    if (signed?.fastCode) return signed.fastCode;
  }
  return (await getMapSiteOwnerSession()) || (await getRegisteredMapSiteFastCode()) || null;
}

export type PmcGateResult =
  | { ok: true; fastCode: string | null; reason: "signed" | "paid" | "admin" }
  | { ok: false; reason: "noClaim" | "unsigned"; href: string; fastCode: string | null };

export async function checkPmcRegistrationGate(fastCodeParam?: string | null): Promise<PmcGateResult> {
  if (await isMapSiteAdmin()) return { ok: true, fastCode: null, reason: "admin" };
  const fastCode = await resolveVisitorFastCode(fastCodeParam);
  const claimed = await findClaimedMapSite(fastCode);
  if (!claimed) return { ok: false, reason: "noClaim", href: PMC_CLAIM_START, fastCode: null };
  const paid = await hasCompletedMapSiteActivationPayment({
    mapsiteId: claimed.id,
    fastCode: claimed.fastCode,
    reconcileFromStripe: false,
  }).catch(() => false);
  if (paid) return { ok: true, fastCode: claimed.fastCode, reason: "paid" };
  if (await getSignedContractForFastCode(claimed.fastCode)) {
    return { ok: true, fastCode: claimed.fastCode, reason: "signed" };
  }
  return {
    ok: false,
    reason: "unsigned",
    href: pmcHref(PMC_PATHS.talispros, { fastCode: claimed.fastCode }),
    fastCode: claimed.fastCode,
  };
}

/** Page-level guard: redirects to the claim start or the PMC sequence. */
export async function enforcePmcRegistrationGate(fastCodeParam?: string | null): Promise<PmcGateResult & { ok: true }> {
  const gate = await checkPmcRegistrationGate(fastCodeParam);
  if (!gate.ok) redirect(gate.href);
  return gate;
}

export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
