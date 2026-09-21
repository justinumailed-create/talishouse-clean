export interface DiscountCode {
  type: "percentage" | "fixed";
  value: number;
}

export interface PaymentOptions {
  full: {
    enabled: boolean;
  };
  partial: {
    enabled: boolean;
    percentage: number;
  };
}

export interface LeaseToOwn {
  enabled: boolean;
  maxMonths: number;
  adminFeePercent: number;
  downPaymentPercent: number;
  interestRate: number;
}

export interface PricingConfig {
  /**
   * Unused leftover from the old single Canada rate. Live checkout uses
   * `lib/canada-sales-tax.ts` (GST/HST/PST by province). Kept optional so
   * stored admin / localStorage payloads still parse.
   */
  taxRate?: number;
  paymentOptions: PaymentOptions;
  leaseToOwn: LeaseToOwn;
  discounts: {
    enabled: boolean;
    codes: Record<string, DiscountCode>;
  };
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  paymentOptions: {
    full: {
      enabled: true,
    },
    partial: {
      enabled: true,
      percentage: 0.05,
    },
  },
  leaseToOwn: {
    enabled: true,
    maxMonths: 60,
    adminFeePercent: 0.05,
    downPaymentPercent: 0.5,
    interestRate: 0.08,
  },
  discounts: {
    enabled: true,
    codes: {
      PAC5: {
        type: "percentage",
        value: 0.05,
      },
    },
  },
};

export const PRICING_CONFIG: PricingConfig = DEFAULT_PRICING_CONFIG;
