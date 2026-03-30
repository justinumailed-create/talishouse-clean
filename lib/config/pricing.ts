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
  taxRate: number;
  paymentOptions: PaymentOptions;
  leaseToOwn: LeaseToOwn;
  discounts: {
    enabled: boolean;
    codes: Record<string, DiscountCode>;
  };
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  taxRate: 0.14,
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
