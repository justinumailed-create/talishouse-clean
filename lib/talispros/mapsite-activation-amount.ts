import { planSummaryFor, type PlanType } from "@/lib/registration-plans";

export const MAPSITE_ACTIVATION_CURRENCY = "cad";

export function mapsiteActivationUnitAmountCents(planType: PlanType): number {
  const { total } = planSummaryFor(planType);
  return Math.round(total * 100);
}
