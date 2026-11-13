"use server";

import { acceptAgentGateSecret } from "@/lib/talispros/prospect-gate-server";

/**
 * Agent code before SamCart checkout. Accepts the checkout allowlist only
 * (aritri, enanko, ralf, arun, demo), case-insensitive, with surrounding
 * spaces ignored.
 */
export async function redeemRegisterEntryAction(input: {
  code: string;
}): Promise<{ ok: true } | { ok: false; error: "badCode" | "tooMany" | "notReady" }> {
  const result = await acceptAgentGateSecret(typeof input?.code === "string" ? input.code : "");
  if (result.ok) return { ok: true };
  if (result.error === "limited") return { ok: false, error: "tooMany" };
  if (result.error === "failed") return { ok: false, error: "notReady" };
  return { ok: false, error: "badCode" };
}
