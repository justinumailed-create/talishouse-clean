"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart, PaymentStrategy, BASE_BUILD_PRICE } from "@/context/CartContext";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { supabase } from "@/lib/supabase";
import { syncTransactionToSplits } from "@/lib/splits";
import { getPricingConfig, calculateLeaseToOwn } from "@/lib/utils/pricingEngine";

const DEFAULT_PRODUCT_IMAGE = "/images/placeholder.png";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test";

export default function CartDrawer() {
  const config = getPricingConfig();
  
  const {
    items,
    isOpen,
    closeCart,
    rawSubtotal,
    discountedSubtotal,
    subtotalWithBase,
    tax,
    grandTotal,
    promoCode,
    promoInfo,
    setDiscount,
    paymentStrategy,
    ltoTermMonths,
    ltoMonthlyPayment,
    removePromoCode,
    setPaymentStrategy,
    setLtoTermMonths,
    getPaymentAmount,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [promoMessage, setPromoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<typeof items>([]);
  const [paymentType, setPaymentType] = useState<"full" | "partial">("full");

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    const upperCode = promoInput.toUpperCase().trim();
    
    const PROMO_CODES: Record<string, { discountPercent: number; message: string }> = {
      FAST5: { discountPercent: 0, message: "FAST5 applied: 5% Deposit mode activated." },
      PAC3: { discountPercent: 3, message: "PAC3 applied: 3% discount activated. Pre-payment required within 30 days." },
      PAC5: { discountPercent: 5, message: "PAC5 applied: 5% discount activated. Pre-payment required within 10 days." },
      PAC10: { discountPercent: 10, message: "PAC10 applied: 10% discount activated. Valid for 2+ units within 12 months." },
      SPLITS: { discountPercent: 20, message: "SPLITS applied: 20% wholesale procurement margin activated." },
      OAC: { discountPercent: 0, message: "Lease-to-Own selected. 50% down payment required." },
    };

    const promo = PROMO_CODES[upperCode];
    if (!promo) {
      setPromoMessage({ type: "error", text: "Invalid promo code. Please try again." });
      return;
    }

    setDiscount({ code: upperCode, percent: promo.discountPercent });
    setPromoMessage({ type: "success", text: promo.message });
    setPromoInput("");
  };

  const savePayment = async (transactionId: string) => {
    try {
      await supabase.from("payments").insert([{
        product_name: items.map(i => i.name).join(", "),
        amount: getPaymentAmount(),
        user_name: "Cart Purchase",
        status: paymentStrategy === "deposit" ? "deposit" : paymentStrategy === "lto" ? "lto" : "completed",
      }]);

      const fastCode = promoCode || "DIRECT";
      const basePrice = rawSubtotal;
      const addonsValue = 0;

      const { data: dealData, error: dealError } = await supabase.from("deals_v2").insert([{
        client_name: "Cart Purchase",
        phone: "",
        project_details: items.map(i => `${i.name} x${i.quantity}`).join(", "),
        status: "new",
        fast_code: fastCode,
        source: "cart",
        base_price: basePrice,
        addons_value: addonsValue,
      }]).select().single();

      if (!dealError && dealData) {
        await supabase.from("transactions").insert([{
          deal_id: dealData.id,
          fast_code: fastCode,
          amount: getPaymentAmount(),
          payment_type: paymentStrategy,
        }]);

        await syncTransactionToSplits(
          dealData.id,
          fastCode,
          getPaymentAmount(),
          paymentStrategy
        );
      }
    } catch (err) {
      console.error("Error saving payment:", err);
    }
  };

  const handlePaymentSuccess = async () => {
    setPurchasedItems([...items]);
    setPaymentSuccess(true);
    clearCart();
    setIsCheckingOut(false);
  };

  const paymentAmount = paymentType === "partial" ? grandTotal * 0.05 : grandTotal;

  const getPaymentLabel = () => {
    const initialPaymentPercent = (config.paymentOptions.partial.percentage * 100).toFixed(0);
    const downPaymentPercent = (config.leaseToOwn.downPaymentPercent * 100).toFixed(0);
    
    switch (paymentStrategy) {
      case "full":
        return `Full Payment — CAD $${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case "deposit":
        return `${initialPaymentPercent}% Deposit — CAD $${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case "lto":
        return `LTO — CAD $${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} down (${downPaymentPercent}%) + CAD $${ltoMonthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo × ${ltoTermMonths} months`;
      default:
        return "";
    }
  };

  const getAvailablePaymentOptions = () => {
    const initialPaymentPercent = (config.paymentOptions.partial.percentage * 100).toFixed(0);
    const downPaymentPercent = (config.leaseToOwn.downPaymentPercent * 100).toFixed(0);
    
    if (!promoInfo) {
      return [
        { value: "full" as PaymentStrategy, label: "Full Payment" },
        { value: "deposit" as PaymentStrategy, label: `${initialPaymentPercent}% Initial Payment` },
      ];
    }
    
    const options: { value: PaymentStrategy; label: string }[] = [];
    
    if (promoInfo.allowsPayment.includes("full")) {
      options.push({ value: "full", label: "Full Payment" });
    }
    if (promoInfo.allowsPayment.includes("deposit")) {
      const label = promoCode === "FAST5" ? `${initialPaymentPercent}% Deposit` : `${initialPaymentPercent}% Initial Payment`;
      options.push({ value: "deposit", label });
    }
    if (promoInfo.allowsPayment.includes("lto")) {
      options.push({ value: "lto", label: `Lease-to-Own (${downPaymentPercent}% down)` });
    }
    
    return options;
  };

  if (!isOpen) return null;

  if (paymentSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-end">
        <div className="absolute inset-0 bg-black/50" onClick={closeCart} />
        <div className="relative w-full max-w-md bg-white h-full shadow-xl p-6 flex flex-col">
          <button
            onClick={closeCart}
            className="absolute top-4 right-4 text-[#6e6e73] hover:text-[#1d1d1f] transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex-1 flex flex-col items-center justify-center text-center overflow-y-auto">
            <div className="w-16 h-16 bg-[rgba(52,199,89,0.1)] rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#34c759]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-2 tracking-tight">Payment Successful!</h2>
            <p className="text-[#6e6e73] mb-6">Thank you for your purchase. You will receive a confirmation email shortly.</p>
            
            {purchasedItems.length > 0 && (
              <div className="w-full max-w-xs mx-auto mb-6">
                <h3 className="text-sm font-semibold text-[#6e6e73] mb-3">Order Summary</h3>
                <div className="space-y-3">
                  {purchasedItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 text-left bg-[#f5f5f7] rounded-xl p-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-[#86868b] text-xs">No img</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1d1d1f] truncate">{item.name}</p>
                        <p className="text-xs text-[#6e6e73]">CAD ${item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Link
              href="/"
              onClick={closeCart}
              className="btn-primary"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={closeCart} />
      <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[rgba(0,0,0,0.06)]">
          <h2 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">Your Cart ({items.length})</h2>
          <button
            onClick={closeCart}
            className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#6e6e73] mb-4">Your cart is empty</p>
              <Link href="/catalog" onClick={closeCart} className="text-black hover:underline">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-[rgba(0,0,0,0.06)] last:border-0">
                  <div className="w-20 h-20 bg-[#f5f5f7] rounded-xl flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[#86868b] text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-[#1d1d1f]">{item.name}</h3>
                    <p className="text-[#6e6e73] text-sm">CAD ${item.price.toLocaleString()}</p>
                    {item.options && Object.keys(item.options).length > 0 && (
                      <p className="text-xs text-[#86868b] mt-1">
                        {Object.values(item.options).slice(0, 2).join(", ")}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 border border-[rgba(0,0,0,0.08)] rounded-lg flex items-center justify-center text-xs text-[#6e6e73] hover:bg-[#f5f5f7] transition"
                      >
                        -
                      </button>
                      <span className="text-sm text-[#1d1d1f]">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 border border-[rgba(0,0,0,0.08)] rounded-lg flex items-center justify-center text-xs text-[#6e6e73] hover:bg-[#f5f5f7] transition"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-auto text-xs text-[#ff3b30] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[rgba(0,0,0,0.06)] p-4 space-y-4">
            {/* Promo Code Section */}
            <div className="space-y-2">
              {!promoCode ? (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Promo code"
                      className="flex-1 px-4 py-3 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white text-sm outline-none transition-all duration-200 focus:border-black focus:ring-2 focus:ring-black/20"
                    />
                    <button
                      onClick={handleApplyPromo}
                      className="btn-secondary px-4"
                    >
                      Apply
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-[rgba(52,199,89,0.08)] rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm text-[#1d1d1f]">{promoCode}</span>
                      {promoInfo && (
                        <p className="text-xs text-[#34c759] mt-1">{promoInfo.message}</p>
                      )}
                    </div>
                    <button
                      onClick={removePromoCode}
                      className="text-[#6e6e73] hover:text-[#ff3b30] text-sm transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
              {promoMessage && (
                <p className={`text-xs ${promoMessage.type === "error" ? "text-[#ff3b30]" : "text-[#34c759]"}`}>
                  {promoMessage.text}
                </p>
              )}
            </div>

            {/* Order Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6e6e73]">Subtotal:</span>
                <span className="text-[#1d1d1f]">CAD ${rawSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              {promoInfo && promoInfo.discountPercent > 0 && (
                <div className="flex justify-between text-[#34c759]">
                  <span>Discount ({promoInfo.code} -{promoInfo.discountPercent}%):</span>
                  <span>- CAD ${(rawSubtotal - discountedSubtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              
              {promoInfo && (
                <div className="flex justify-between">
                  <span className="text-[#6e6e73]">Discounted Subtotal:</span>
                  <span className="text-[#1d1d1f]">CAD ${discountedSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-[#1d1d1f] font-medium">Build & Price</span>
                <span className="text-[#1d1d1f]">CAD ${BASE_BUILD_PRICE.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-[#6e6e73]">Subtotal with Build</span>
                <span className="text-[#1d1d1f]">CAD ${subtotalWithBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-[#6e6e73]">Tax ({(config.taxRate * 100).toFixed(0)}%):</span>
                <span className="text-[#1d1d1f]">CAD ${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-[rgba(0,0,0,0.06)]">
                <span className="text-[#1d1d1f]">TOTAL:</span>
                <span className="text-[#1d1d1f]">CAD ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Payment Type */}
            <div className="space-y-3">
              <p className="font-medium text-sm text-[#1d1d1f]">Payment Type</p>
              
              <button
                type="button"
                onClick={() => setPaymentType("full")}
                className={`w-full p-3 rounded-xl border transition-all duration-300 ${
                  paymentType === "full"
                    ? "bg-black text-white border-transparent shadow-md"
                    : "bg-white border-[rgba(0,0,0,0.08)] text-[#1d1d1f] hover:border-black/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Full Payment</span>
                  <span className={`text-xs ${paymentType === "full" ? "text-white/80" : "text-[#6e6e73]"}`}>
                    CAD ${grandTotal.toLocaleString()}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType("partial")}
                className={`w-full p-3 rounded-xl border transition-all duration-300 ${
                  paymentType === "partial"
                    ? "bg-black text-white border-transparent shadow-md"
                    : "bg-white border-[rgba(0,0,0,0.08)] text-[#1d1d1f] hover:border-black/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">5% Initial Payment</span>
                  <span className={`text-xs ${paymentType === "partial" ? "text-white/80" : "text-[#6e6e73]"}`}>
                    CAD ${(grandTotal * 0.05).toLocaleString()}
                  </span>
                </div>
              </button>
            </div>

            {!isCheckingOut ? (
              <button
                onClick={() => setIsCheckingOut(true)}
                className="w-full btn-primary"
              >
                Proceed to Checkout — CAD ${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </button>
            ) : (
              <div className="space-y-3">
                <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID }}>
                  <PayPalButtons
                    style={{ layout: "horizontal", color: "black", shape: "rect" }}
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [{
                          description: "Talishouse Products",
                          amount: {
                            currency_code: "CAD",
                            value: paymentAmount.toFixed(2),
                          },
                        }],
                      });
                    }}
                    onApprove={async (data, actions) => {
                      if (actions.order) {
                        const details = await actions.order.capture();
                        console.log("Payment captured:", details);
                        await savePayment(details.id || "");
                        handlePaymentSuccess();
                      }
                    }}
                    onError={(err) => {
                      console.error("PayPal error:", err);
                    }}
                  />
                </PayPalScriptProvider>
                <button
                  onClick={() => setIsCheckingOut(false)}
                  className="w-full text-sm text-[#6e6e73] hover:text-[#1d1d1f] transition"
                >
                  Back to Cart
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
