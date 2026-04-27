"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  getPricingConfig,
  calculateLeaseToOwn,
  calculatePartialPayment,
  type PricingConfig,
} from "@/lib/utils/pricingEngine";
import {
  DISCOUNT_CODES,
  validateDiscountCode,
  applyDiscounts,
  type AppliedDiscount,
  type DiscountStackConfig,
  DEFAULT_STACK_CONFIG,
} from "@/lib/utils/discounts";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  options?: Record<string, string>;
  addons?: string[];
  metadata?: Record<string, any>;
  wholesaleRequested?: boolean;
  leaseToOwnRequested?: boolean;
}

export interface SplitsJob {
  amount: number;
  details: string;
}

export type PromoCode = 
  | "310"
  | "FAST5" 
  | "PAC3" 
  | "PAC5" 
  | "PAC10" 
  | "PTC10"
  | "SPLITS" 
  | "OAC"
  | null;

export type PaymentStrategy = "full" | "deposit" | "lto";

export const SHIPPING_CLEARANCE = 10000;
export const BUILD_AND_PRICE = 1950;
export const TAX_RATE = 0.14;

export interface PromoCodeInfo {
  code: PromoCode;
  discountPercent: number;
  label: string;
  message: string;
  allowsPayment: ("full" | "deposit" | "lto")[];
  isWholesale: boolean;
  timeCondition?: {
    days: number;
    message: string;
  };
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  rawSubtotal: number;
  discountedSubtotal: number;
  subtotalWithCharge: number;
  tax: number;
  grandTotal: number;
  itemCount: number;
  promoCode: PromoCode;
  appliedDiscounts: AppliedDiscount[];
  totalDiscount: number;
  promoInfo: PromoCodeInfo | null;
  paymentStrategy: PaymentStrategy;
  ltoTermMonths: number;
  ltoMonthlyPayment: number;
  stackConfig: DiscountStackConfig;
  splitsAmount: number;
  splitsJobs: SplitsJob[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: (code?: string) => void;
  setDiscount: (options: { code: string; percent: number }) => void;
  setPaymentStrategy: (strategy: PaymentStrategy) => void;
  setLtoTermMonths: (months: number) => void;
  addSplitsJob: () => void;
  removeSplitsJob: (index: number) => void;
  updateSplitsJob: (index: number, job: Partial<SplitsJob>) => void;
  getPaymentAmount: () => number;
  getSubtotalWithCharge: () => number;
  openCart: () => void;
  closeCart: () => void;
  getCheckoutMetadata: () => Record<string, unknown>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "talishouse_cart";

export function CartProvider({ children, pricingConfig }: { children: ReactNode; pricingConfig?: PricingConfig }) {
  const config = pricingConfig || getPricingConfig();
  
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [appliedDiscountCodes, setAppliedDiscountCodes] = useState<PromoCode[]>([]);
  const [paymentStrategy, setPaymentStrategy] = useState<PaymentStrategy>("full");
  const [ltoTermMonths, setLtoTermMonths] = useState(config.leaseToOwn.maxMonths);
  const [stackConfig] = useState<DiscountStackConfig>(DEFAULT_STACK_CONFIG);
  const [splitsJobs, setSplitsJobs] = useState<SplitsJob[]>([]);

  const splitsAmount = useMemo(() => {
    return splitsJobs.reduce((sum, job) => sum + job.amount, 0);
  }, [splitsJobs]);

  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    const hydrate = () => setIsHydrated(true);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const itemsToSet = parsed.items || [];
        const promoToSet = parsed.appliedDiscountCodes || [];
        const splitsJobsToSet = parsed.splitsJobs || [];
        
        setTimeout(() => {
          if (itemsToSet.length > 0) setItems(itemsToSet);
          if (promoToSet.length > 0) setAppliedDiscountCodes(promoToSet);
          if (splitsJobsToSet.length > 0) setSplitsJobs(splitsJobsToSet);
          hydrate();
        }, 0);
      } catch (e) {
        console.error("Failed to parse cart from localStorage:", e);
        setTimeout(hydrate, 0);
      }
    } else {
      setTimeout(hydrate, 0);
    }
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items, appliedDiscountCodes, splitsJobs }));
    }
  }, [items, appliedDiscountCodes, isHydrated, splitsJobs]);

  const rawSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const { appliedDiscounts, totalDiscount, discountedSubtotal } = useMemo(() => {
    return applyDiscounts(appliedDiscountCodes.filter(Boolean) as string[], rawSubtotal, stackConfig);
  }, [appliedDiscountCodes, rawSubtotal, stackConfig]);

  const promoCode = appliedDiscountCodes[0] || null;

  const promoInfo = useMemo((): PromoCodeInfo | null => {
    if (!promoCode || !DISCOUNT_CODES[promoCode]) return null;
    const discount = DISCOUNT_CODES[promoCode];
    return {
      code: promoCode,
      discountPercent: discount.type === "percentage" ? discount.value * 100 : 0,
      label: discount.label,
      message: discount.description,
      allowsPayment: discount.validPaymentModes as ("full" | "deposit" | "lto")[],
      isWholesale: !discount.stackable,
      timeCondition: discount.timeCondition,
    };
  }, [promoCode]);

  const subtotalWithCharge = useMemo(() => {
    return discountedSubtotal + BUILD_AND_PRICE;
  }, [discountedSubtotal]);

  const tax = useMemo(() => {
    return subtotalWithCharge * TAX_RATE;
  }, [subtotalWithCharge]);

  const grandTotal = useMemo(() => {
    return subtotalWithCharge + tax;
  }, [subtotalWithCharge, tax]);

  const ltoMonthlyPayment = useMemo(() => {
    const leaseCalc = calculateLeaseToOwn({
      totalAmount: grandTotal,
      months: ltoTermMonths,
      config,
    });
    return leaseCalc.monthlyPayment;
  }, [grandTotal, ltoTermMonths, config]);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const addToCart = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedDiscountCodes([]);
    setPaymentStrategy("full");
    setSplitsJobs([]);
  }, []);

  const applyPromoCode = useCallback((code: string): { success: boolean; message: string } => {
    const upperCode = code.toUpperCase().trim();
    const validation = validateDiscountCode(upperCode, config);
    
    if (!validation.valid || !validation.discount) {
      return { success: false, message: validation.message || "Invalid promo code. Please try again." };
    }

    const discount = validation.discount;
    
    if (!stackConfig.allowStacking && appliedDiscountCodes.length > 0) {
      setAppliedDiscountCodes([upperCode as PromoCode]);
    } else if (!appliedDiscountCodes.includes(upperCode as PromoCode)) {
      if (discountedSubtotal > 0) {
        setAppliedDiscountCodes((prev) => [...prev, upperCode as PromoCode]);
      } else {
        setAppliedDiscountCodes([upperCode as PromoCode]);
      }
    }

    if (upperCode === "OAC") {
      setPaymentStrategy("lto");
    } else if (discount.validPaymentModes.includes("deposit")) {
      setPaymentStrategy("deposit");
    } else {
      setPaymentStrategy("full");
    }

    return { success: true, message: discount.description };
  }, [config, stackConfig, appliedDiscountCodes, discountedSubtotal]);

  const removePromoCode = useCallback((code?: string) => {
    if (code) {
      setAppliedDiscountCodes((prev) => prev.filter((c) => c !== code));
    } else {
      setAppliedDiscountCodes([]);
    }
  }, []);

  const getPaymentAmount = useCallback(() => {
    const totalWithSplits = grandTotal + splitsAmount;
    switch (paymentStrategy) {
      case "full":
        return totalWithSplits;
      case "deposit": {
        const partial = calculatePartialPayment({ total: totalWithSplits, config });
        return partial.initialPayment;
      }
      case "lto": {
        const lease = calculateLeaseToOwn({ totalAmount: totalWithSplits, months: ltoTermMonths, config });
        return lease.downPayment;
      }
      default:
        return totalWithSplits;
    }
  }, [paymentStrategy, grandTotal, splitsAmount, ltoTermMonths, config]);

  const getSubtotalWithCharge = useCallback(() => {
    return subtotalWithCharge;
  }, [subtotalWithCharge]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const getCheckoutMetadata = useCallback(() => {
    if (typeof window === "undefined") {
      return {};
    }
    
    try {
      const stored = localStorage.getItem("talishouse_associate");
      const associate = stored ? JSON.parse(stored) : null;
      
      return {
        fastCode: associate?.fastCode || null,
        associateId: associate?.id || null,
        associateName: associate?.name || null,
        splitsAmount: splitsAmount,
        splitsJobs: splitsJobs,
      };
    } catch {
      return {};
    }
  }, [splitsAmount, splitsJobs]);

  const addSplitsJob = useCallback(() => {
    setSplitsJobs((prev) => {
      if (prev.length >= 10) return prev;
      return [...prev, { amount: 0, details: "" }];
    });
  }, []);

  const removeSplitsJob = useCallback((index: number) => {
    setSplitsJobs((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateSplitsJob = useCallback((index: number, updatedJob: Partial<SplitsJob>) => {
    setSplitsJobs((prev) =>
      prev.map((job, i) => (i === index ? { ...job, ...updatedJob } : job))
    );
  }, []);

  const setDiscount = useCallback((options: { code: string; percent: number }) => {
    const { code } = options;
    const upperCode = code.toUpperCase();
    if (!appliedDiscountCodes.includes(upperCode as PromoCode)) {
      setAppliedDiscountCodes((prev) => [...prev, upperCode as PromoCode]);
    }
  }, [appliedDiscountCodes]);

  const value = useMemo(() => ({
    items,
    isOpen,
    rawSubtotal,
    discountedSubtotal,
    subtotalWithCharge,
    tax,
    grandTotal,
    itemCount,
    promoCode,
    appliedDiscounts,
    totalDiscount,
    promoInfo,
    paymentStrategy,
    ltoTermMonths,
    ltoMonthlyPayment,
    stackConfig,
    splitsAmount,
    splitsJobs,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyPromoCode,
    setDiscount,
    removePromoCode,
    setPaymentStrategy,
    setLtoTermMonths,
    addSplitsJob,
    removeSplitsJob,
    updateSplitsJob,
    getPaymentAmount,
    getSubtotalWithCharge,
    openCart,
    closeCart,
    getCheckoutMetadata,
  }), [
    items,
    isOpen,
    rawSubtotal,
    discountedSubtotal,
    subtotalWithCharge,
    tax,
    grandTotal,
    itemCount,
    promoCode,
    appliedDiscounts,
    totalDiscount,
    promoInfo,
    paymentStrategy,
    ltoTermMonths,
    ltoMonthlyPayment,
    stackConfig,
    splitsAmount,
    splitsJobs,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyPromoCode,
    setDiscount,
    removePromoCode,
    setPaymentStrategy,
    setLtoTermMonths,
    getPaymentAmount,
    getSubtotalWithCharge,
    openCart,
    closeCart,
    getCheckoutMetadata,
    addSplitsJob,
    removeSplitsJob,
    updateSplitsJob
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
