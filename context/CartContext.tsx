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

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  options?: Record<string, string>;
  addons?: string[];
  wholesaleRequested?: boolean;
  leaseToOwnRequested?: boolean;
}

const DEFAULT_PRODUCT_IMAGE = "/images/placeholder.png";

export type PromoCode = 
  | "FAST5" 
  | "PAC3" 
  | "PAC5" 
  | "PAC10" 
  | "SPLITS" 
  | "OAC"
  | null;

export type PaymentStrategy = "full" | "deposit" | "lto";

export const BASE_BUILD_PRICE = 8995;

export interface PromoCodeInfo {
  code: PromoCode;
  discountPercent: number;
  label: string;
  message: string;
  allowsPayment: ("full" | "deposit" | "lto")[];
  isWholesale: boolean;
}

const PROMO_CODES: Record<string, PromoCodeInfo> = {
  FAST5: {
    code: "FAST5",
    discountPercent: 0,
    label: "5% Deposit",
    message: "Deposits turn into Down Payments when you sign off on the project.",
    allowsPayment: ["full", "deposit"],
    isWholesale: false,
  },
  PAC3: {
    code: "PAC3",
    discountPercent: 3,
    label: "PAC3",
    message: "PAC3 applied: 3% discount activated. Pre-payment required within 30 days of your order.",
    allowsPayment: ["full"],
    isWholesale: false,
  },
  PAC5: {
    code: "PAC5",
    discountPercent: 5,
    label: "PAC5",
    message: "PAC5 applied: 5% discount activated. Pre-payment required within 10 days of your order.",
    allowsPayment: ["full"],
    isWholesale: false,
  },
  PAC10: {
    code: "PAC10",
    discountPercent: 10,
    label: "PAC10",
    message: "PAC10 applied: 10% discount activated. Valid for 2+ units purchased within 12 months.",
    allowsPayment: ["full"],
    isWholesale: false,
  },
  SPLITS: {
    code: "SPLITS",
    discountPercent: 20,
    label: "SPLITS",
    message: "SPLITS applied: 20% wholesale procurement margin activated. This order is flagged for wholesale review.",
    allowsPayment: ["full", "deposit"],
    isWholesale: true,
  },
  OAC: {
    code: "OAC",
    discountPercent: 0,
    label: "Lease-to-Own",
    message: "Lease-to-Own selected. 50% down payment required.",
    allowsPayment: ["full", "lto"],
    isWholesale: false,
  },
};

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  rawSubtotal: number;
  discountedSubtotal: number;
  subtotalWithBase: number;
  tax: number;
  grandTotal: number;
  itemCount: number;
  promoCode: PromoCode;
  promoInfo: PromoCodeInfo | null;
  paymentStrategy: PaymentStrategy;
  ltoTermMonths: number;
  ltoMonthlyPayment: number;
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  setDiscount: (options: { code: string; percent: number }) => void;
  removePromoCode: () => void;
  setPaymentStrategy: (strategy: PaymentStrategy) => void;
  setLtoTermMonths: (months: number) => void;
  getPaymentAmount: () => number;
  getSubtotalWithBase: () => number;
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
  const [promoCode, setPromoCode] = useState<PromoCode>(null);
  const [paymentStrategy, setPaymentStrategy] = useState<PaymentStrategy>("full");
  const [ltoTermMonths, setLtoTermMonths] = useState(config.leaseToOwn.maxMonths);

  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    const hydrate = () => setIsHydrated(true);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const itemsToSet = parsed.items || [];
        const promoToSet = parsed.promoCode || null;
        setTimeout(() => {
          if (itemsToSet.length > 0) setItems(itemsToSet);
          if (promoToSet) setPromoCode(promoToSet);
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
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items, promoCode }));
    }
  }, [items, promoCode, isHydrated]);

  const rawSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const promoInfo = useMemo(() => {
    return promoCode ? PROMO_CODES[promoCode] : null;
  }, [promoCode]);

  const discountedSubtotal = useMemo(() => {
    if (!promoInfo) return rawSubtotal;
    return rawSubtotal * (1 - promoInfo.discountPercent / 100);
  }, [rawSubtotal, promoInfo]);

  const subtotalWithBase = useMemo(() => {
    return discountedSubtotal + BASE_BUILD_PRICE;
  }, [discountedSubtotal]);

  const tax = useMemo(() => {
    return subtotalWithBase * config.taxRate;
  }, [subtotalWithBase, config.taxRate]);

  const grandTotal = useMemo(() => {
    return subtotalWithBase + tax;
  }, [subtotalWithBase, tax]);

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
    setPromoCode(null);
    setPaymentStrategy("full");
  }, []);

  const applyPromoCode = useCallback((code: string): { success: boolean; message: string } => {
    const upperCode = code.toUpperCase().trim();
    const promo = PROMO_CODES[upperCode];
    
    if (!promo) {
      return { success: false, message: "Invalid promo code. Please try again." };
    }

    setPromoCode(upperCode as PromoCode);
    
    if (upperCode === "OAC") {
      setPaymentStrategy("lto");
    } else if (promo.allowsPayment.includes("deposit") && !promo.allowsPayment.includes("full")) {
      setPaymentStrategy("deposit");
    } else {
      setPaymentStrategy("full");
    }

    return { success: true, message: promo.message };
  }, []);

  const removePromoCode = useCallback(() => {
    setPromoCode(null);
    setPaymentStrategy("full");
  }, []);

  const getPaymentAmount = useCallback(() => {
    switch (paymentStrategy) {
      case "full":
        return grandTotal;
      case "deposit": {
        const partial = calculatePartialPayment({ total: grandTotal, config });
        return partial.initialPayment;
      }
      case "lto": {
        const lease = calculateLeaseToOwn({ totalAmount: grandTotal, months: ltoTermMonths, config });
        return lease.downPayment;
      }
      default:
        return grandTotal;
    }
  }, [paymentStrategy, grandTotal, ltoTermMonths, config]);

  const getSubtotalWithBase = useCallback(() => {
    return subtotalWithBase;
  }, [subtotalWithBase]);

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
      };
    } catch {
      return {};
    }
  }, []);

  const setDiscount = useCallback((options: { code: string; percent: number }) => {
    const { code, percent } = options;
    const promoInfo: PromoCodeInfo = {
      code: code as PromoCode,
      discountPercent: percent,
      label: code,
      message: `${code} applied: ${percent}% discount activated.`,
      allowsPayment: ["full"],
      isWholesale: false,
    };
    setPromoCode(code as PromoCode);
  }, []);

  const value = useMemo(() => ({
    items,
    isOpen,
    rawSubtotal,
    discountedSubtotal,
    subtotalWithBase,
    tax,
    grandTotal,
    itemCount,
    promoCode,
    promoInfo,
    paymentStrategy,
    ltoTermMonths,
    ltoMonthlyPayment,
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
    getSubtotalWithBase,
    openCart,
    closeCart,
    getCheckoutMetadata,
  }), [
    items,
    isOpen,
    rawSubtotal,
    discountedSubtotal,
    subtotalWithBase,
    tax,
    grandTotal,
    itemCount,
    promoCode,
    promoInfo,
    paymentStrategy,
    ltoTermMonths,
    ltoMonthlyPayment,
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
    getSubtotalWithBase,
    openCart,
    closeCart,
    getCheckoutMetadata,
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
