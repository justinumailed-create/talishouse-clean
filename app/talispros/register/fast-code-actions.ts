"use server";

import type { OfferedSubscriptionTier } from "@/lib/mapsite-subscription";
import { parseOfferedSubscriptionTier } from "@/lib/mapsite-subscription";
import {
  resolveRegistrationFastCodeRedirect,
  validateRegistrationSponsorFastCode,
} from "@/lib/registration-fast-code-routing";

export async function routeRegistrationByFastCode(
  code: string,
  plan: string
): Promise<{ ok: true; redirectTo: string } | { ok: false; error: string }> {
  const currentPlan = parseOfferedSubscriptionTier(plan) as OfferedSubscriptionTier;
  return resolveRegistrationFastCodeRedirect(code, currentPlan);
}

export async function validateSponsorFastCode(
  code: string,
  accountCategory: "derivative" | "adpro"
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  return validateRegistrationSponsorFastCode(code, accountCategory);
}
