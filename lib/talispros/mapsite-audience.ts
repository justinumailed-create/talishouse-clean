import type {
  RegistrationAccountCategory,
  RegistrationMarket,
} from "@/lib/registration-market";
import { REGISTRATION_MARKET_COPY } from "@/lib/registration-market";
import {
  PLAN_DETAILS,
  type PlanType,
  registrationTotalFor,
} from "@/lib/registration-plans";

/** Map Start / MapSite audience → registration account category. */
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
  const plan = PLAN_DETAILS[planTypeForAudience(audience)];
  const total = registrationTotalFor(plan.price);
  return {
    planLabel: plan.label,
    priceLabel: `CAD $${plan.price.toFixed(2)}`,
    totalLabel: `CAD $${total.toFixed(2)} (incl. tax)`,
  };
}

/** MapSite claim payment is always Root Account™ (PayPal on /talispros/register). */
export function rootAccountPlanSummary(): {
  planLabel: string;
  priceLabel: string;
  totalLabel: string;
} {
  const plan = PLAN_DETAILS.ROOT_ACCOUNT;
  const total = registrationTotalFor(plan.price);
  return {
    planLabel: plan.label,
    priceLabel: `CAD $${plan.price.toFixed(2)}`,
    totalLabel: `CAD $${total.toFixed(2)} (incl. tax)`,
  };
}

/**
 * PayPal Root Account™ checkout for MapSite™ claims.
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

/** Paid / activated markets unlock Express Interest instead of the payment CTA. */
export function isMapSitePaid(status: string): boolean {
  return status === "ACTIVE";
}
