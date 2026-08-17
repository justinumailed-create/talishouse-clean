export const REGISTRATION_TAX_RATE = 0.14;

export type PlanType =
  | "TEST_ACCOUNT"
  | "ROOT_ACCOUNT"
  | "ROOT_ACCOUNT_1"
  | "DERIVATIVE_ACCOUNT"
  | "ADPRO_SINGLE"
  | "ADPRO_10"
  | "ADPRO_100"
  | "ADPRO_UNLIMITED";

export interface PlanDetail {
  label: string;
  price: number;
  monthly?: number;
  bullets?: string[];
  description?: string;
  /** Prefer "GST" vs generic "tax" in checkout copy. */
  taxLabel?: "tax" | "GST";
}

export const PLAN_DETAILS: Record<PlanType, PlanDetail> = {
  TEST_ACCOUNT: {
    label: "TEST Account",
    price: 10,
    monthly: 0,
    description: "Demonstration and QA account (Root-equivalent behavior).",
    bullets: [
      "Demo-only Root-equivalent onboarding",
      "CAD $10 one-time registration",
      "For demonstrations and QA",
    ],
  },
  ROOT_ACCOUNT_1: {
    label: "Root Account™ ($1)",
    price: 1,
    monthly: 0,
    taxLabel: "GST",
    description:
      "CAD $1 Root Account™ activation — unlock Express Interest and admin Mapsite™ management.",
    bullets: [
      "CAD $1.00 + GST one-time activation",
      "Enables Express an Interest form",
      "Activates Mapsite™ for admin management",
      "Root-equivalent FAST Code generation",
    ],
  },
  ROOT_ACCOUNT: {
    label: "Root Account™",
    price: 998.5,
    monthly: 98.5,
    description: "Market ownership and full platform access.",
    bullets: [
      "Up to 100 Derivative Accounts",
      "SPLITS enabled",
      "Claim A Market™ eligible",
      "FAST Code generation",
      "Market ownership capabilities",
    ],
  },
  DERIVATIVE_ACCOUNT: {
    label: "Derivative Account™",
    price: 198.5,
    monthly: 98.5,
    description: "Multi-PIN account under a Root Account™.",
    bullets: [
      "Multi-PIN support",
      "Operates under Root Account™",
      "SPLITS enabled",
      "FAST Code generation",
    ],
  },
  ADPRO_SINGLE: {
    label: "Single Adpro PIN",
    price: 49.95,
    description: "Individual business placement.",
  },
  ADPRO_10: {
    label: "Up To 10 Adpro PINs",
    price: 249.95,
    description: "Small teams and multi-location operators.",
  },
  ADPRO_100: {
    label: "Up To 100 Adpro PINs",
    price: 499.95,
    description: "Brokerages, franchises, regional organizations.",
  },
  ADPRO_UNLIMITED: {
    label: "Unlimited Adpro PINs",
    price: 999.95,
    description: "Enterprise deployment.",
  },
};

export const ADPRO_PLANS: PlanType[] = [
  "ADPRO_SINGLE",
  "ADPRO_10",
  "ADPRO_100",
  "ADPRO_UNLIMITED",
];

export function registrationTotalFor(price: number): number {
  return Math.round((price + price * REGISTRATION_TAX_RATE) * 100) / 100;
}

export function registrationTaxAmountFor(price: number): number {
  return Math.round(price * REGISTRATION_TAX_RATE * 100) / 100;
}

export function isRootPlanType(planType: string): boolean {
  return (
    planType === "ROOT_ACCOUNT" ||
    planType === "ROOT_ACCOUNT_1" ||
    planType === "TEST_ACCOUNT"
  );
}

export function planSummaryFor(planType: PlanType): {
  planLabel: string;
  priceLabel: string;
  taxLabel: string;
  totalLabel: string;
  price: number;
  tax: number;
  total: number;
} {
  const plan = PLAN_DETAILS[planType];
  const tax = registrationTaxAmountFor(plan.price);
  const total = registrationTotalFor(plan.price);
  const taxWord = plan.taxLabel === "GST" ? "GST" : "tax";
  return {
    planLabel: plan.label,
    priceLabel: `CAD $${plan.price.toFixed(2)}`,
    taxLabel: `CAD $${tax.toFixed(2)} ${taxWord}`,
    totalLabel: `CAD $${total.toFixed(2)} (incl. ${taxWord})`,
    price: plan.price,
    tax,
    total,
  };
}

/** Claim-form accountType → PayPal plan. */
export function planTypeForClaimAccountType(accountType: string): PlanType {
  const normalized = accountType.trim().toLowerCase();
  if (normalized === "root-1" || normalized === "root_1") {
    return "ROOT_ACCOUNT_1";
  }
  if (normalized === "root" || normalized === "test") {
    return normalized === "test" ? "TEST_ACCOUNT" : "ROOT_ACCOUNT";
  }
  if (normalized.startsWith("adpro")) return "ADPRO_SINGLE";
  if (normalized === "fsbo" || normalized === "fsbos") return "ROOT_ACCOUNT_1";
  if (normalized === "derivative") return "DERIVATIVE_ACCOUNT";
  return "ROOT_ACCOUNT";
}

export function isRootLikeClaimAccountType(accountType: string): boolean {
  const normalized = accountType.trim().toLowerCase();
  return (
    normalized === "root" ||
    normalized === "root-1" ||
    normalized === "root_1" ||
    normalized === "test"
  );
}
