"use server";

import { resolveFastCodeAdminAccount } from "@/lib/admin-auth";
import { hasCompletedMapSiteActivationPayment } from "@/lib/talispros/mapsite-payment";
import { isTalisUKbPassword } from "@/lib/talisu/kb-gate";

/** Paid-up (Stripe / PayPal / recorded cash) account FAST Code. */
async function isActiveAccountFastCode(code: string | null | undefined): Promise<boolean> {
  const fastCode = code?.trim();
  if (!fastCode) return false;
  return hasCompletedMapSiteActivationPayment({ fastCode, reconcileFromStripe: false });
}

// No signed-in bypass: owners, agents and admins all enter a FAST Code below.

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
