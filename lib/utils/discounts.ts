import { PricingConfig, DEFAULT_PRICING_CONFIG } from "@/lib/config/pricing";
import { formatCAD } from "@/utils/currency";

export type DiscountType = "percentage" | "fixed";
export type PaymentMode = "full" | "deposit" | "lto";

export interface DiscountRule {
  code: string;
  type: DiscountType;
  value: number;
  label: string;
  description: string;
  stackable: boolean;
  validPaymentModes: PaymentMode[];
  timeCondition?: {
    days: number;
    message: string;
  };
}

export interface AppliedDiscount {
  code: string;
  type: DiscountType;
  value: number;
  label: string;
  amount: number;
}

export interface DiscountStackConfig {
  allowStacking: boolean;
  maxDiscounts: number;
  combineType: "add" | "best_only" | "first_only";
}

const DEFAULT_STACK_CONFIG: DiscountStackConfig = {
  allowStacking: true,
  maxDiscounts: 3,
  combineType: "add",
};

export const DISCOUNT_CODES: Record<string, DiscountRule> = {
  "310": {
    code: "310",
    type: "percentage",
    value: 0.03,
    label: "3% Early Bird",
    description: "3% discount if purchase completed within 10 days",
    stackable: true,
    validPaymentModes: ["full"],
    timeCondition: {
      days: 10,
      message: "Complete purchase within 10 days to receive 3% discount",
    },
  },
  FAST5: {
    code: "FAST5",
    type: "percentage",
    value: 0.05,
    label: "5% Deposit",
    description: "5% deposit system - deposits turn into down payments",
    stackable: true,
    validPaymentModes: ["full", "deposit"],
  },
  PAC5: {
    code: "PAC5",
    type: "percentage",
    value: 0.05,
    label: "PAC5 Retail",
    description: "5% retail discount",
    stackable: true,
    validPaymentModes: ["full"],
  },
  PTC10: {
    code: "PTC10",
    type: "percentage",
    value: 0.10,
    label: "PTC10 Retail",
    description: "10% retail discount",
    stackable: true,
    validPaymentModes: ["full"],
  },
  PAC3: {
    code: "PAC3",
    type: "percentage",
    value: 0.03,
    label: "PAC3 Early",
    description: "3% discount - pre-payment required within 30 days",
    stackable: true,
    validPaymentModes: ["full"],
    timeCondition: {
      days: 30,
      message: "Pre-payment required within 30 days",
    },
  },
  PAC10: {
    code: "PAC10",
    type: "percentage",
    value: 0.10,
    label: "PAC10 Bulk",
    description: "10% discount valid for 2+ units within 12 months",
    stackable: true,
    validPaymentModes: ["full"],
  },
  SPLITS: {
    code: "SPLITS",
    type: "percentage",
    value: 0.20,
    label: "Wholesale SPLITS",
    description: "20% wholesale procurement margin",
    stackable: false,
    validPaymentModes: ["full", "deposit"],
  },
  OAC: {
    code: "OAC",
    type: "percentage",
    value: 0,
    label: "Lease-to-Own",
    description: "50% down payment required for LTO",
    stackable: true,
    validPaymentModes: ["lto"],
  },
};

export function validateDiscountCode(
  code: string,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): { valid: boolean; discount?: DiscountRule; message?: string } {
  if (!config.discounts.enabled) {
    return { valid: false, message: "Discounts are currently disabled" };
  }

  const discount = DISCOUNT_CODES[code.toUpperCase()];
  if (!discount) {
    return { valid: false, message: "Invalid discount code" };
  }

  return { valid: true, discount };
}

export function isDiscountStackable(code: string): boolean {
  const discount = DISCOUNT_CODES[code.toUpperCase()];
  return discount?.stackable ?? false;
}

export function canApplyDiscountToPaymentMode(
  code: string,
  mode: PaymentMode
): boolean {
  const discount = DISCOUNT_CODES[code.toUpperCase()];
  return discount?.validPaymentModes.includes(mode) ?? false;
}

export function calculateDiscountAmount(
  code: string,
  subtotal: number
): number {
  const discount = DISCOUNT_CODES[code.toUpperCase()];
  if (!discount) return 0;

  if (discount.type === "percentage") {
    return subtotal * discount.value;
  }
  return discount.value;
}

export { DEFAULT_STACK_CONFIG };

export function applyDiscounts(
  codes: string[],
  subtotal: number,
  stackConfig: DiscountStackConfig = DEFAULT_STACK_CONFIG
): { appliedDiscounts: AppliedDiscount[]; totalDiscount: number; discountedSubtotal: number } {
  if (codes.length === 0) {
    return { appliedDiscounts: [], totalDiscount: 0, discountedSubtotal: subtotal };
  }

  const appliedDiscounts: AppliedDiscount[] = [];
  let runningSubtotal = subtotal;
  let totalDiscount = 0;
  let discountCount = 0;

  for (const code of codes) {
    if (discountCount >= stackConfig.maxDiscounts) break;

    const discount = DISCOUNT_CODES[code.toUpperCase()];
    if (!discount) continue;

    if (!stackConfig.allowStacking && appliedDiscounts.length > 0) {
      if (stackConfig.combineType === "best_only") {
        const newAmount = calculateDiscountAmount(code, subtotal);
        const bestAmount = Math.max(...appliedDiscounts.map(d => d.amount));
        if (newAmount > bestAmount) {
          appliedDiscounts.length = 0;
          runningSubtotal = subtotal;
          totalDiscount = 0;
        } else {
          continue;
        }
      } else if (stackConfig.combineType === "first_only") {
        break;
      }
    }

    const amount = calculateDiscountAmount(code, runningSubtotal);
    appliedDiscounts.push({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      label: discount.label,
      amount,
    });
    totalDiscount += amount;
    runningSubtotal -= amount;
    discountCount++;
  }

  return {
    appliedDiscounts,
    totalDiscount,
    discountedSubtotal: Math.max(0, subtotal - totalDiscount),
  };
}

export function getDiscountInfo(code: string): DiscountRule | null {
  return DISCOUNT_CODES[code.toUpperCase()] || null;
}

export function getAllDiscountCodes(): DiscountRule[] {
  return Object.values(DISCOUNT_CODES);
}

export function formatDiscount(code: string, subtotal: number): string {
  const discount = DISCOUNT_CODES[code.toUpperCase()];
  if (!discount) return "";

  if (discount.type === "percentage") {
    const amount = calculateDiscountAmount(code, subtotal);
    return `-${(discount.value * 100).toFixed(0)}% (${formatCAD(amount)})`;
  }
  return `-${formatCAD(discount.value)}`;
}
