"use server";

import { getAdminSessionAccount, resolveFastCodeAdminAccount } from "@/lib/admin-auth";
import { getMapSiteOwnerSession, getRegisteredMapSiteFastCode } from "@/lib/mapsite-edit-auth";
import { hasCompletedMapSiteActivationPayment } from "@/lib/talispros/mapsite-payment";
import { isTalisUKbPassword } from "@/lib/talisu/kb-gate";

/** Paid-up (Stripe / PayPal / recorded cash) account FAST Code. */
async function isActiveAccountFastCode(code: string | null | undefined): Promise<boolean> {
  const fastCode = code?.trim();
  if (!fastCode) return false;
  return hasCompletedMapSiteActivationPayment({ fastCode, reconcileFromStripe: false });
}

/**
 * Signed-in active accounts open the Knowledge Base directly: any admin /
 * agent session, or a Mapsite owner / registered-account session whose FAST
 * Code is paid up. Visitors (no session) still get the FAST Code gate.
 */
export async function getTalisUKbSessionAccessAction(): Promise<boolean> {
  if (await getAdminSessionAccount()) return true;
  const codes = new Set(
    [await getMapSiteOwnerSession(), await getRegisteredMapSiteFastCode()].filter(Boolean) as string[],
  );
  for (const code of codes) {
    if (await isActiveAccountFastCode(code)) return true;
  }
  return false;
}

/**
 * Gate unlock: a valid FAST Code (admin FAST Code incl. ARUN, or any paid-up
 * account) or the legacy KB password. Previously only the password worked,
 * so entering a real FAST Code never unlocked.
 */
export async function unlockTalisUKbAction(input: string): Promise<{ ok: boolean }> {
  const value = String(input ?? "").trim();
  if (!value) return { ok: false };
  if (isTalisUKbPassword(value)) return { ok: true };
  if (value.length > 32 || !/^[A-Za-z0-9-]+$/.test(value)) return { ok: false };
  if (await resolveFastCodeAdminAccount(value)) return { ok: true };
  return { ok: await isActiveAccountFastCode(value) };
}
