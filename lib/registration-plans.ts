export const REGISTRATION_TAX_RATE = 0.14;

export type PlanType =
  | "ROOT_ACCOUNT"
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
}

export const PLAN_DETAILS: Record<PlanType, PlanDetail> = {
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
    monthly: 19.5,
    description: "Multi-PIN account under a Root Account™.",
    bullets: [
      "Multi-PIN support",
      "Operates under Root Account™",
      "SPLITS enabled",
      "FAST Code generation",
    ],
  },
  ADPRO_SINGLE: {
    label: "Single AdPro™ PIN",
    price: 49.95,
    description: "Individual business placement.",
  },
  ADPRO_10: {
    label: "Up To 10 AdPro™ PINs",
    price: 249.95,
    description: "Small teams and multi-location operators.",
  },
  ADPRO_100: {
    label: "Up To 100 AdPro™ PINs",
    price: 499.95,
    description: "Brokerages, franchises, regional organizations.",
  },
  ADPRO_UNLIMITED: {
    label: "Unlimited AdPro™ PINs",
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
  return price + price * REGISTRATION_TAX_RATE;
}
