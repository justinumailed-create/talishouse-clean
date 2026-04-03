"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart, PaymentStrategy, BASE_BUILD_PRICE } from "@/context/CartContext";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { supabase } from "@/lib/supabase";
import { syncTransactionToSplits } from "@/lib/splits";
import { getPricingConfig, calculateLeaseToOwn } from "@/lib/utils/pricingEngine";
import { UI } from "@/styles/design-system";

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
      const paymentPayload = {
        product_name: items.map(i => i.name).join(", "),
        amount: getPaymentAmount(),
        user_name: "Cart Purchase",
        status: paymentStrategy === "deposit" ? "deposit" : paymentStrategy === "lto" ? "lto" : "completed",
      };
      console.log("PAYMENT INSERT - Payload:", JSON.stringify(paymentPayload, null, 2));

      const { error: paymentError } = await supabase.from("payments").insert([paymentPayload]);
      if (paymentError) {
        console.error("PAYMENT INSERT ERROR:", JSON.stringify(paymentError, null, 2));
      } else {
        console.log("PAYMENT INSERT SUCCESS");
      }

      const fastCode = promoCode || "DIRECT";
      const basePrice = rawSubtotal;
      const addonsValue = 0;

      const dealPayload = {
        client_name: "Cart Purchase",
        phone: "",
        project_details: items.map(i => `${i.name} x${i.quantity}`).join(", "),
        status: "new",
        fast_code: fastCode,
        source: "cart",
        base_price: basePrice,
        addons_value: addonsValue,
      };
      console.log("DEAL INSERT - Payload:", JSON.stringify(dealPayload, null, 2));

      const { data: dealData, error: dealError } = await supabase.from("deals_v2").insert([dealPayload]).select().single();

      if (dealError) {
        console.error("DEAL INSERT ERROR:", JSON.stringify(dealError, null, 2));
        return;
      }
      console.log("DEAL INSERT SUCCESS:", JSON.stringify(dealData, null, 2));

      if (dealData) {
        const txPayload = {
          deal_id: dealData.id,
          fast_code: fastCode,
          amount: getPaymentAmount(),
          payment_type: paymentStrategy,
        };
        console.log("TRANSACTION INSERT - Payload:", JSON.stringify(txPayload, null, 2));

        const { error: txError } = await supabase.from("transactions").insert([txPayload]);
        if (txError) {
          console.error("TRANSACTION INSERT ERROR:", JSON.stringify(txError, null, 2));
        } else {
          console.log("TRANSACTION INSERT SUCCESS");
        }

        await syncTransactionToSplits(
          dealData.id,
          fastCode,
          getPaymentAmount(),
          paymentStrategy
        );
      }
    } catch (err: any) {
      console.error("Save payment failed:", err);
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
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeCart} />
        <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col">
          <button
            onClick={closeCart}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex-1 flex flex-col items-center justify-center text-center overflow-y-auto">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-500 mb-6">Thank you for your purchase. You will receive a confirmation email shortly.</p>
            
            {purchasedItems.length > 0 && (
              <div className="w-full max-w-xs mx-auto mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Order Summary</h3>
                <div className="space-y-3">
                  {purchasedItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 text-left bg-gray-50 rounded-xl p-3">
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
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400 text-xs">No img</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">CAD ${item.price.toLocaleString()}</p>
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeCart} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Your Cart ({items.length})</h2>
          <button
            onClick={closeCart}
            className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <Link href="/catalog" onClick={closeCart} className="text-gray-900 hover:underline font-medium">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                  <div className="w-20 h-20 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden">
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
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-gray-900">{item.name}</h3>
                    <p className="text-gray-500 text-sm">CAD ${item.price.toLocaleString()}</p>
                    {item.options && Object.keys(item.options).length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {Object.values(item.options).slice(0, 2).join(", ")}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        -
                      </button>
                      <span className="text-sm text-gray-900 w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-auto text-xs text-red-500 hover:text-red-700 transition-colors"
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
          <div className="border-t border-gray-100 p-6 space-y-4">
            {/* Promo Code Section */}
            <div className="space-y-2">
              {!promoCode ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Promo code"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  />
                  <button
                    onClick={handleApplyPromo}
                    className="px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm text-gray-900">{promoCode}</span>
                      {promoInfo && (
                        <p className="text-xs text-green-600 mt-1">{promoInfo.message}</p>
                      )}
                    </div>
                    <button
                      onClick={removePromoCode}
                      className="text-gray-400 hover:text-red-500 text-sm transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
              {promoMessage && (
                <p className={`text-xs ${promoMessage.type === "error" ? "text-red-500" : "text-green-600"}`}>
                  {promoMessage.text}
                </p>
              )}
            </div>

            {/* Order Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal:</span>
                <span className="text-gray-900">CAD ${rawSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              {promoInfo && promoInfo.discountPercent > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({promoInfo.code} -{promoInfo.discountPercent}%):</span>
                  <span>- CAD ${(rawSubtotal - discountedSubtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              
              {promoInfo && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Discounted Subtotal:</span>
                  <span className="text-gray-900">CAD ${discountedSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-900 font-medium">Build & Price</span>
                <span className="text-gray-900">CAD ${BASE_BUILD_PRICE.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal with Build</span>
                <span className="text-gray-900">CAD ${subtotalWithBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Tax ({(config.taxRate * 100).toFixed(0)}%):</span>
                <span className="text-gray-900">CAD ${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-100">
                <span className="text-gray-900">TOTAL:</span>
                <span className="text-gray-900">CAD ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Payment Type */}
            <div className="space-y-3">
              <p className="font-medium text-sm text-gray-900">Payment Type</p>
              
              <button
                type="button"
                onClick={() => setPaymentType("full")}
                className={`w-full p-4 rounded-xl border transition-all duration-200 ${
                  paymentType === "full"
                    ? "bg-gray-900 text-white border-transparent shadow-lg"
                    : "bg-white border-gray-200 text-gray-900 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Full Payment</span>
                  <span className={`text-xs ${paymentType === "full" ? "text-white/70" : "text-gray-500"}`}>
                    CAD ${grandTotal.toLocaleString()}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType("partial")}
                className={`w-full p-4 rounded-xl border transition-all duration-200 ${
                  paymentType === "partial"
                    ? "bg-gray-900 text-white border-transparent shadow-lg"
                    : "bg-white border-gray-200 text-gray-900 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">5% Initial Payment</span>
                  <span className={`text-xs ${paymentType === "partial" ? "text-white/70" : "text-gray-500"}`}>
                    CAD ${(grandTotal * 0.05).toLocaleString()}
                  </span>
                </div>
              </button>
            </div>

            {!isCheckingOut ? (
              <button
                onClick={() => setIsCheckingOut(true)}
                className="btn-primary w-full"
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
                    onError={(err: any) => {
                      console.warn("PayPal error:", err?.message || err);
                    }}
                  />
                </PayPalScriptProvider>
                <button
                  onClick={() => setIsCheckingOut(false)}
                  className="w-full text-sm text-gray-500 hover:text-gray-900 transition-colors"
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
