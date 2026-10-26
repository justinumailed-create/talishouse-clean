"use server";

import { resolveFastCodeAdminAccount } from "@/lib/admin-auth";
import { hasCompletedMapSiteActivationPayment } from "@/lib/talispros/mapsite-payment";

/** Paid-up (Stripe / PayPal / recorded cash) account FAST Code. */
async function isActiveAccountFastCode(code: string | null | undefined): Promise<boolean> {
  const fastCode = code?.trim();
  if (!fastCode) return false;
  return hasCompletedMapSiteActivationPayment({ fastCode, reconcileFromStripe: false });
}

// No signed-in bypass: owners, agents and admins all enter a FAST Code below.

/**
 * Gate unlock (server only — used by the /talisu/kb page gate and the header
 * TalisU unlock panel alike): a valid FAST Code only — an admin FAST Code
 * (Global Admin or active grant) or a paid-up account FAST Code. There is no
 * shared KB password; nothing secret ships to the client.
 */
export async function unlockTalisUKbAction(input: string): Promise<{ ok: boolean }> {
  const value = String(input ?? "").trim();
  if (!value) return { ok: false };
  if (value.length > 32 || !/^[A-Za-z0-9-]+$/.test(value)) return { ok: false };
  if (await resolveFastCodeAdminAccount(value)) return { ok: true };
  return { ok: await isActiveAccountFastCode(value) };
}
