import type {
  RegistrationAccountCategory,
  RegistrationMarket,
} from "@/lib/registration-market";
import { REGISTRATION_MARKET_COPY } from "@/lib/registration-market";
import type { CanadaProvinceCode } from "@/lib/canada-sales-tax";
import { parseCanadaProvince } from "@/lib/canada-sales-tax";
import {
  type PlanSummary,
  type PlanType,
  PLAN_DETAILS,
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

function pendingTaxSummary(planType: PlanType): PlanSummary & {
  needsProvince: true;
} {
  const plan = PLAN_DETAILS[planType];
  return {
    planLabel: plan.label,
    priceLabel: `CAD $${plan.price.toFixed(2)}`,
    taxLabel: "Select province / territory for tax",
    totalLabel: `CAD $${plan.price.toFixed(2)} + tax`,
    price: plan.price,
    tax: 0,
    total: plan.price,
    taxWord: "tax",
    province: null,
    needsProvince: true,
  };
}

export function audiencePlanSummary(
  audience: RegistrationMarket,
  province?: string | null,
): {
  planLabel: string;
  priceLabel: string;
  totalLabel: string;
} {
  const planType = planTypeForAudience(audience);
  const code = parseCanadaProvince(province);
  if (!code) {
    const pending = pendingTaxSummary(planType);
    return {
      planLabel: pending.planLabel,
      priceLabel: pending.priceLabel,
      totalLabel: pending.totalLabel,
    };
  }
  const summary = planSummaryFor(planType, code);
  return {
    planLabel: summary.planLabel,
    priceLabel: summary.priceLabel,
    totalLabel: summary.totalLabel,
  };
}

/** Default Mapsite™ claim payment (full Root) when no claim selection is known. */
export function rootAccountPlanSummary(province?: string | null): {
  planLabel: string;
  priceLabel: string;
  totalLabel: string;
  taxLabel: string;
} {
  const summary = mapsiteClaimPlanSummary("ROOT_ACCOUNT", province);
  return {
    planLabel: summary.planLabel,
    priceLabel: summary.priceLabel,
    totalLabel: summary.totalLabel,
    taxLabel: summary.taxLabel,
  };
}

/** Activate-card pricing. Retired $1 ROOT_ACCOUNT_1 displays as full Root. */
export function mapsiteClaimPlanSummary(
  planType: PlanType = "ROOT_ACCOUNT",
  province?: CanadaProvinceCode | string | null,
): PlanSummary & {
  planType: PlanType;
  needsProvince: boolean;
} {
  const checkoutPlan = checkoutPlanTypeForActivation(planType);
  const code = parseCanadaProvince(province);
  if (!code) {
    return {
      ...pendingTaxSummary(checkoutPlan),
      planType: checkoutPlan,
    };
  }
  return {
    ...planSummaryFor(checkoutPlan, code),
    planType: checkoutPlan,
    needsProvince: false,
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
