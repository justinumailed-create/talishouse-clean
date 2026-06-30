import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { OfferedSubscriptionTier } from "@/lib/mapsite-subscription";

export type RegistrationFastCodeTier = "root" | "derivative" | "adpro";

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function tierFromAccountType(
  accountType: string | null | undefined
): RegistrationFastCodeTier | null {
  if (!accountType) return null;
  const value = accountType.trim().toUpperCase();
  if (value === "ROOT" || value === "ROOT_ACCOUNT") return "root";
  if (value === "DERIVATIVE" || value === "DERIVATIVE_ACCOUNT") {
    return "derivative";
  }
  if (value === "ADPRO" || value.startsWith("ADPRO_")) return "adpro";
  return null;
}

export async function lookupFastCodeRegistrationTier(
  rawCode: string
): Promise<{ found: boolean; tier: RegistrationFastCodeTier | null; code: string }> {
  const code = normalizeCode(rawCode);
  if (!code) {
    return { found: false, tier: null, code };
  }

  const supabase = getSupabaseAdmin();

  const { data: fastCodeRow } = await supabase
    .from("fast_codes")
    .select("code, account_type")
    .ilike("code", code)
    .maybeSingle();

  if (fastCodeRow) {
    return {
      found: true,
      tier: tierFromAccountType(fastCodeRow.account_type),
      code: fastCodeRow.code.toUpperCase(),
    };
  }

  const { data: mapsiteRow } = await supabase
    .from("mapsites")
    .select("fast_code, account_type")
    .ilike("fast_code", code)
    .maybeSingle();

  if (mapsiteRow) {
    return {
      found: true,
      tier: tierFromAccountType(mapsiteRow.account_type),
      code: mapsiteRow.fast_code.toUpperCase(),
    };
  }

  const { data: registrationRow } = await supabase
    .from("registrations")
    .select("fast_code, account_type")
    .ilike("fast_code", code)
    .maybeSingle();

  if (registrationRow) {
    return {
      found: true,
      tier: tierFromAccountType(registrationRow.account_type),
      code: registrationRow.fast_code.toUpperCase(),
    };
  }

  const { data: accountRow } = await supabase
    .from("accounts")
    .select("fast_code, account_type")
    .ilike("fast_code", code)
    .maybeSingle();

  if (accountRow) {
    return {
      found: true,
      tier: tierFromAccountType(accountRow.account_type),
      code: accountRow.fast_code.toUpperCase(),
    };
  }

  return { found: false, tier: null, code };
}

export function buildMapsiteRedirectUrl(fastCode: string): string {
  return `/talispros/build-mapsite?fastCode=${encodeURIComponent(
    fastCode.trim().toLowerCase()
  )}`;
}

export function nextRegistrationUrl(
  currentPlan: OfferedSubscriptionTier,
  parentCode: string
): string | null {
  const code = encodeURIComponent(normalizeCode(parentCode));
  if (currentPlan === "root") {
    return `/talispros/register?plan=derivative&parentFastCode=${code}`;
  }
  if (currentPlan === "derivative") {
    return `/talispros/register?plan=adpro&parentFastCode=${code}`;
  }
  return null;
}

export async function resolveRegistrationFastCodeRedirect(
  code: string,
  currentPlan: OfferedSubscriptionTier
): Promise<{ ok: true; redirectTo: string } | { ok: false; error: string }> {
  if (currentPlan === "adpro") {
    return {
      ok: false,
      error: "FAST Code routing is not available on the AdPro™ registration page.",
    };
  }

  const lookup = await lookupFastCodeRegistrationTier(code);
  if (!lookup.found || !lookup.tier) {
    return {
      ok: false,
      error: "FAST Code not recognized. Check the code and try again.",
    };
  }

  if (currentPlan === "root" && lookup.tier !== "root") {
    return {
      ok: false,
      error: "This FAST Code is not linked to a Root Account™.",
    };
  }

  if (currentPlan === "derivative" && lookup.tier !== "derivative") {
    return {
      ok: false,
      error: "This FAST Code is not linked to a Derivative Account™.",
    };
  }

  const redirectTo = nextRegistrationUrl(currentPlan, lookup.code);
  if (!redirectTo) {
    return { ok: false, error: "Unable to route from this registration page." };
  }

  return { ok: true, redirectTo };
}
