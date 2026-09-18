import type {
  RegistrationAccountCategory,
  RegistrationMarket,
} from "@/lib/registration-market";
import { REGISTRATION_MARKET_COPY } from "@/lib/registration-market";
import {
  type PlanType,
  checkoutPlanTypeForActivation,
  planSummaryFor,
  planTypeForClaimAccountType,
} from "@/lib/registration-plans";

/** Map Start / Mapsite™ audience → registration account category. */
export function accountCategoryForAudience(
  audience: RegistrationMarket
): RegistrationAccountCategory {
  if (audience === "brokers") return "root";
  if (audience === "adpro" || audience === "fsbos") return "adpro";
  return "derivative";
}

export function planTypeForAudience(audience: RegistrationMarket): PlanType {
  const category = accountCategoryForAudience(audience);
  if (category === "root") return "ROOT_ACCOUNT";
  if (category === "adpro") return "ADPRO_SINGLE";
  return "DERIVATIVE_ACCOUNT";
}

export function audiencePaymentLabel(audience: RegistrationMarket): string {
  return REGISTRATION_MARKET_COPY[audience].label;
}

export function audiencePlanSummary(audience: RegistrationMarket): {
  planLabel: string;
  priceLabel: string;
  totalLabel: string;
} {
  const summary = planSummaryFor(planTypeForAudience(audience));
  return {
    planLabel: summary.planLabel,
    priceLabel: summary.priceLabel,
    totalLabel: summary.totalLabel,
  };
}

/** Default Mapsite™ claim payment (full Root) when no claim selection is known. */
export function rootAccountPlanSummary(): {
  planLabel: string;
  priceLabel: string;
  totalLabel: string;
  taxLabel: string;
} {
  const summary = planSummaryFor("ROOT_ACCOUNT");
  return {
    planLabel: summary.planLabel,
    priceLabel: summary.priceLabel,
    totalLabel: summary.totalLabel,
    taxLabel: summary.taxLabel,
  };
}

/** Activate-card pricing. Retired $1 ROOT_ACCOUNT_1 displays as full Root. */
export function mapsiteClaimPlanSummary(planType: PlanType = "ROOT_ACCOUNT"): {
  planLabel: string;
  priceLabel: string;
  totalLabel: string;
  taxLabel: string;
  planType: PlanType;
  price: number;
  tax: number;
  total: number;
} {
  const checkoutPlan = checkoutPlanTypeForActivation(planType);
  const summary = planSummaryFor(checkoutPlan);
  return {
    ...summary,
    planType: checkoutPlan,
  };
}

export { planTypeForClaimAccountType };

/**
 * PayPal Root Account™ checkout for Mapsite™ claims.
 * Audience is preserved for copy/routing context; payment plan is always root.
 */
export function buildMapSitePaymentHref(options: {
  audience: RegistrationMarket;
  mapsiteId: string;
  fastCode?: string | null;
  requestId?: string | null;
}): string {
  const params = new URLSearchParams({
    market: options.audience,
    account: "root",
    mapsiteId: options.mapsiteId,
  });

  if (options.requestId?.trim()) {
    params.set("request", options.requestId.trim());
  }

  return `/talispros/register?${params.toString()}`;
}

/** Paid / activated markets hide checkout; the agency logo sits above the manager card. */
export function isMapSitePaid(status: string): boolean {
  return status === "ACTIVE";
}
