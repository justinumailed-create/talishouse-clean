import { planSummaryFor, type PlanType } from "@/lib/registration-plans";

export const MAPSITE_ACTIVATION_CURRENCY = "cad";

/** Checkout cents for a plan. Callers creating new sessions must pass ROOT_ACCOUNT, not ROOT_ACCOUNT_1. */
export function mapsiteActivationUnitAmountCents(planType: PlanType): number {
  const { total } = planSummaryFor(planType);
  return Math.round(total * 100);
}
