import {
  PRICING_CONFIG,
  DEFAULT_PRICING_CONFIG,
  type PricingConfig,
} from "@/lib/config/pricing";

const PRICING_CONFIG_KEY = "pricing_config";

export interface Addon {
  id: string;
  name: string;
  price: number;
}

export interface PriceCalculationResult {
  basePrice: number;
  addonsTotal: number;
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface LeaseCalculationResult {
  totalAmount: number;
  downPayment: number;
  downPaymentPercent: number;
  adminFee: number;
  adminFeePercent: number;
  amountFinanced: number;
  monthlyPayment: number;
  months: number;
  interestRate: number;
  totalPaid: number;
}

export interface PartialPaymentResult {
  total: number;
  initialPayment: number;
  initialPaymentPercent: number;
  remainingAmount: number;
}

export function getPricingConfig(): PricingConfig {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(PRICING_CONFIG_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as PricingConfig;
      } catch {
        return PRICING_CONFIG;
      }
    }
  }
  return PRICING_CONFIG;
}

export function setPricingConfig(config: PricingConfig): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(PRICING_CONFIG_KEY, JSON.stringify(config));
  }
}

export function loadPricingConfigFromStorage(): PricingConfig | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(PRICING_CONFIG_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as PricingConfig;
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function calculateTotal({
  basePrice,
  addons = [],
  discountCode,
  config = PRICING_CONFIG,
}: {
  basePrice: number;
  addons?: Addon[];
  discountCode?: string;
  config?: PricingConfig;
}): PriceCalculationResult {
  const addonsTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
  let subtotal = basePrice + addonsTotal;
  let discountAmount = 0;

  if (discountCode && config.discounts.enabled && config.discounts.codes[discountCode]) {
    const discount = config.discounts.codes[discountCode];
    if (discount.type === "percentage") {
      discountAmount = subtotal * discount.value;
      subtotal = subtotal * (1 - discount.value);
    } else if (discount.type === "fixed") {
      discountAmount = discount.value;
      subtotal = Math.max(0, subtotal - discount.value);
    }
  }

  const taxRate = config.taxRate;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  return {
    basePrice,
    addonsTotal,
    subtotal,
    discountAmount,
    discountCode,
    taxRate,
    taxAmount,
    total,
  };
}

export function calculateLeaseToOwn({
  totalAmount,
  months,
  config = PRICING_CONFIG,
}: {
  totalAmount: number;
  months: number;
  config?: PricingConfig;
}): LeaseCalculationResult {
  const {
    enabled,
    maxMonths,
    adminFeePercent,
    downPaymentPercent,
    interestRate,
  } = config.leaseToOwn;

  if (!enabled) {
    throw new Error("Lease-to-own is not enabled");
  }

  const validMonths = Math.min(Math.max(1, months), maxMonths);
  const downPayment = totalAmount * downPaymentPercent;
  const adminFee = totalAmount * adminFeePercent;
  const amountFinanced = totalAmount - downPayment + adminFee;
  
  const monthlyInterestRate = interestRate / 12;
  const monthlyPayment = monthlyInterestRate > 0
    ? (amountFinanced * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, validMonths)) /
      (Math.pow(1 + monthlyInterestRate, validMonths) - 1)
    : amountFinanced / validMonths;

  const totalPaid = downPayment + (monthlyPayment * validMonths);

  return {
    totalAmount,
    downPayment,
    downPaymentPercent,
    adminFee,
    adminFeePercent,
    amountFinanced,
    monthlyPayment,
    months: validMonths,
    interestRate,
    totalPaid,
  };
}

export function calculatePartialPayment({
  total,
  config = PRICING_CONFIG,
}: {
  total: number;
  config?: PricingConfig;
}): PartialPaymentResult {
  const { enabled, percentage } = config.paymentOptions.partial;

  if (!enabled) {
    return {
      total,
      initialPayment: total,
      initialPaymentPercent: 1,
      remainingAmount: 0,
    };
  }

  const initialPayment = total * percentage;
  const remainingAmount = total - initialPayment;

  return {
    total,
    initialPayment,
    initialPaymentPercent: percentage,
    remainingAmount,
  };
}

export function validateDiscountCode(
  code: string,
  config = PRICING_CONFIG
): { valid: boolean; discount?: { type: string; value: number } } {
  if (!config.discounts.enabled) {
    return { valid: false };
  }

  const discount = config.discounts.codes[code.toUpperCase()];
  if (discount) {
    return { valid: true, discount };
  }

  return { valid: false };
}

export function formatCurrency(amount: number): string {
  return `CAD $${amount.toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

export function getTaxRate(config = PRICING_CONFIG): number {
  return config.taxRate;
}

export function getInitialPaymentPercent(config = PRICING_CONFIG): number {
  return config.paymentOptions.partial.percentage;
}

export function isLeaseToOwnEnabled(config = PRICING_CONFIG): boolean {
  return config.leaseToOwn.enabled;
}

export function getMaxLeaseMonths(config = PRICING_CONFIG): number {
  return config.leaseToOwn.maxMonths;
}

export function getDiscountCodes(config = PRICING_CONFIG): Record<string, { type: string; value: number }> {
  return config.discounts.codes;
}

export {
  DEFAULT_PRICING_CONFIG,
  type PricingConfig,
  type DiscountCode,
  type PaymentOptions,
  type LeaseToOwn,
} from "@/lib/config/pricing";
