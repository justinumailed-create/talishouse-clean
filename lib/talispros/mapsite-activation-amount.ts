import { planSummaryFor, type PlanType } from "@/lib/registration-plans";

export const MAPSITE_ACTIVATION_CURRENCY = "cad";

/**
 * Checkout cents for a plan.
 * New sessions must pass ROOT_ACCOUNT (not ROOT_ACCOUNT_1) and a Canadian
 * province. ROOT_ACCOUNT_1 remains the historical $1 + 14% GST matcher.
 */
export function mapsiteActivationUnitAmountCents(
  planType: PlanType,
  province?: string | null,
): number {
  const { total } = planSummaryFor(planType, province);
  return Math.round(total * 100);
}
