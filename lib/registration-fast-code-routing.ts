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

  const value = accountType
    .trim()
    .toUpperCase()
    .replace(/™/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!value) return null;
  if (value === "ROOT" || value === "ROOT_ACCOUNT" || value.startsWith("ROOT")) {
    return "root";
  }
  if (
    value === "DERIVATIVE" ||
    value === "DERIVATIVE_ACCOUNT" ||
    value.startsWith("DERIVATIVE")
  ) {
    return "derivative";
  }
  if (value === "ADPRO" || value.startsWith("ADPRO")) {
    return "adpro";
  }
  return null;
}

async function resolveFastCodeTier(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  code: string,
  accountType: string | null | undefined,
  mapsiteId: string | null | undefined
): Promise<RegistrationFastCodeTier | null> {
  const directTier = tierFromAccountType(accountType);
  if (directTier) return directTier;

  if (mapsiteId) {
    const { data: linkedMapSite } = await supabase
      .from("mapsites")
      .select("account_type")
      .eq("id", mapsiteId)
      .maybeSingle();

    const linkedTier = tierFromAccountType(linkedMapSite?.account_type);
    if (linkedTier) return linkedTier;
  }

  const { data: mapsiteRow } = await supabase
    .from("mapsites")
    .select("account_type")
    .ilike("fast_code", code)
    .maybeSingle();

  return tierFromAccountType(mapsiteRow?.account_type);
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
    .select("code, account_type, mapsite_id")
    .ilike("code", code)
    .maybeSingle();

  if (fastCodeRow) {
    const tier = await resolveFastCodeTier(
      supabase,
      code,
      fastCodeRow.account_type,
      fastCodeRow.mapsite_id
    );

    return {
      found: true,
      tier,
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

  if (registrationRow?.fast_code) {
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

export function buildMapSiteRedirectUrl(fastCode: string): string {
  return `/talispros/mapsites/${encodeURIComponent(
    fastCode.trim().toLowerCase()
  )}`;
}

export function nextRegistrationUrl(
  currentPlan: OfferedSubscriptionTier,
  parentCode: string,
  market: string = "listings"
): string | null {
  const code = encodeURIComponent(normalizeCode(parentCode));
  const marketParam = encodeURIComponent(market);
  if (currentPlan === "root") {
    return `/talispros/register?market=${marketParam}&account=derivative&sponsor=${code}`;
  }
  if (currentPlan === "derivative") {
    return `/talispros/register?market=${marketParam}&account=adpro&sponsor=${code}`;
  }
  return null;
}

export async function validateRegistrationSponsorFastCode(
  rawCode: string,
  accountCategory: "derivative" | "adpro"
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const currentPlan: OfferedSubscriptionTier =
    accountCategory === "derivative" ? "root" : "derivative";

  const lookup = await lookupFastCodeRegistrationTier(rawCode);
  if (!lookup.found) {
    return {
      ok: false,
      error: "FAST Code not recognized. Check the code and try again.",
    };
  }

  if (!lookup.tier) {
    return {
      ok: false,
      error:
        "FAST Code found but has no account type. Set Account Type to root in admin FAST Codes.",
    };
  }

  if (!isValidSponsorTier(currentPlan, lookup.tier)) {
    return {
      ok: false,
      error: invalidSponsorTierMessage(currentPlan),
    };
  }

  return { ok: true, code: lookup.code };
}

export function isValidSponsorTier(
  currentPlan: OfferedSubscriptionTier,
  sponsorTier: RegistrationFastCodeTier
): boolean {
  if (currentPlan === "root") {
    return sponsorTier === "root";
  }

  if (currentPlan === "derivative") {
    return sponsorTier === "root" || sponsorTier === "derivative";
  }

  return false;
}

function invalidSponsorTierMessage(
  currentPlan: OfferedSubscriptionTier
): string {
  if (currentPlan === "root") {
    return "This FAST Code is not linked to a Root Account™.";
  }

  return "This FAST Code is not linked to a Root Account™ or Derivative Account™.";
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
  if (!lookup.found) {
    return {
      ok: false,
      error: "FAST Code not recognized. Check the code and try again.",
    };
  }

  if (!lookup.tier) {
    return {
      ok: false,
      error:
        "FAST Code found but has no account type. Set Account Type to root in admin FAST Codes.",
    };
  }

  if (!isValidSponsorTier(currentPlan, lookup.tier)) {
    return {
      ok: false,
      error: invalidSponsorTierMessage(currentPlan),
    };
  }

  const redirectTo = nextRegistrationUrl(currentPlan, lookup.code);
  if (!redirectTo) {
    return { ok: false, error: "Unable to route from this registration page." };
  }

  return { ok: true, redirectTo };
}
