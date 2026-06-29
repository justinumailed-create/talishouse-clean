export type OfferedSubscriptionTier = "root" | "derivative" | "adpro";

export const OFFERED_SUBSCRIPTION_TIER_LABELS: Record<
  OfferedSubscriptionTier,
  string
> = {
  root: "Root Account™",
  derivative: "Derivative Account™",
  adpro: "AdPro™",
};

export function parseOfferedSubscriptionTier(
  value: string | null | undefined
): OfferedSubscriptionTier {
  if (value === "derivative" || value === "adpro") {
    return value;
  }
  return "root";
}
