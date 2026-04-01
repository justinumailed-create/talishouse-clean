"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart, BASE_BUILD_PRICE } from "@/context/CartContext";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { supabase } from "@/lib/supabase";
import { syncTransactionToSplits } from "@/lib/splits";
import { getPricingConfig } from "@/lib/utils/pricingEngine";
import { ROUTES } from "@/lib/routes";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test";

export default function CheckoutPage() {
  const config = getPricingConfig();
  const {
    items,
    rawSubtotal,
    discountedSubtotal,
    subtotalWithBase,
    tax,
    grandTotal,
    promoCode,
    promoInfo,
    removePromoCode,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [promoMessage, setPromoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [paymentType, setPaymentType] = useState<"full" | "partial">("full");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<typeof items>([]);

  const finalAmount = paymentType === "partial" ? grandTotal * 0.05 : grandTotal;

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    const upperCode = promoInput.toUpperCase().trim();
    
    const PROMO_CODES: Record<string, { discountPercent: number; message: string }> = {
      FAST5: { discountPercent: 0, message: "FAST5 applied: 5% Deposit mode activated." },
      PAC3: { discountPercent: 3, message: "PAC3 applied: 3% discount activated." },
      PAC5: { discountPercent: 5, message: "PAC5 applied: 5% discount activated." },
      PAC10: { discountPercent: 10, message: "PAC10 applied: 10% discount activated." },
      SPLITS: { discountPercent: 20, message: "SPLITS applied: 20% wholesale procurement margin activated." },
    };

    const promo = PROMO_CODES[upperCode];
    if (!promo) {
      setPromoMessage({ type: "error", text: "Invalid promo code. Please try again." });
      return;
    }

    setPromoMessage({ type: "success", text: promo.message });
    setPromoInput("");
  };

  const savePayment = async () => {
    try {
      await supabase.from("payments").insert([{
        product_name: items.map(i => i.name).join(", "),
        amount: finalAmount,
        user_name: "Checkout Purchase",
        status: "pending",
      }]);

      const fastCode = promoCode || "DIRECT";
      
      await supabase.from("deals_v2").insert([{
        client_name: "Checkout Purchase",
        phone: "",
        project_details: items.map(i => `${i.name} x${i.quantity}`).join(", "),
        status: "new",
        fast_code: fastCode,
        source: "checkout",
        base_price: rawSubtotal,
        addons_value: 0,
      }]);
    } catch (err) {
      console.error("Error saving payment:", err);
    }
  };

  const handlePaymentSuccess = async () => {
    await savePayment();
    setPurchasedItems([...items]);
    setPaymentSuccess(true);
    clearCart();
  };

  if (items.length === 0 && !paymentSuccess) {
    return (
      <div className="min-h-[70vh] bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-4 tracking-tight">Your cart is empty</h1>
          <Link href={ROUTES.CATALOG} className="btn-primary inline-block">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-[70vh] bg-[#f5f5f7] py-12">
        <div className="mx-auto max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-[rgba(0,0,0,0.06)] p-8 text-center transition-all duration-300">
            <div className="w-16 h-16 bg-[rgba(52,199,89,0.1)] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#34c759]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-2 tracking-tight">
              Payment Successful!
            </h2>
            <p className="text-[#6e6e73] mb-6">
              Thank you for your purchase. You will receive a confirmation email shortly.
            </p>
            
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
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No img</span>
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
            
            <Link href={ROUTES.CATALOG} className="btn-primary inline-block">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-[#f5f5f7] py-12">
      <div className="container-main">
        <div className="flex items-center justify-between mb-8">
          <Link href={ROUTES.CATALOG} className="text-sm text-[#6e6e73] hover:text-black transition-colors">
            ← Continue Shopping
          </Link>
          <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">Checkout</h1>
          <div className="w-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LEFT: Information Panel */}
          <div className="w-full">
            <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-[rgba(0,0,0,0.06)]">
                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-[#1d1d1f]">Build & Price</p>
                  <p className="text-sm text-[#6e6e73]">Talishouse™ Collection</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-[#6e6e73] leading-relaxed">
                  <span className="font-semibold text-[#1d1d1f]">Talishouse™</span> starts from $58.80 per sq.ft. 
                  Base model ≈ <span className="font-semibold">$99,950.00</span> for 1,700 sq.ft.
                </p>
              </div>

              <ul className="text-sm text-[#6e6e73] space-y-3 list-disc pl-4">
                <li>
                  The base charge of $8,500 covers sea-container shipping and up to 14 days after pickup from destination port.
                </li>
                <li>
                  Includes incidental costs except customs clearance, taxes, and inland transport.
                </li>
              </ul>

              <div className="bg-gray-100 rounded-xl p-4">
                <p className="text-sm text-black">
                  <span className="font-semibold">Note:</span> Additional features like platforms, roofs, patios, and verandas may incur extra shipping or cost.
                </p>
              </div>

              <div className="pt-4 border-t border-[rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1d1d1f]">Secure Payment</p>
                    <p className="text-xs text-[#6e6e73]">Protected by PayPal encryption</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Cart & Payment */}
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] shadow-sm p-6">
              <h2 className="font-semibold text-[#1d1d1f] mb-4 tracking-tight">Your Order ({items.length})</h2>
              
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
                          <span className="text-gray-400 text-xs">No image</span>
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
            </div>

            {/* Promo Code */}
            <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] shadow-sm p-6">
              {!promoCode ? (
                <>
                  <h3 className="font-semibold text-[#1d1d1f] mb-3 tracking-tight">Promo Code</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Enter code"
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
                <div className="bg-[rgba(52,199,89,0.08)] rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm text-[#1d1d1f]">{promoCode}</span>
                      {promoInfo && (
                        <p className="text-xs text-[#34c759] mt-1">{promoInfo.message}</p>
                      )}
                    </div>
                    <button
                      onClick={removePromoCode}
                      className="text-xs text-[#6e6e73] hover:text-[#ff3b30] transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
              {promoMessage && (
                <p className={`text-xs mt-2 ${promoMessage.type === "error" ? "text-[#ff3b30]" : "text-[#34c759]"}`}>
                  {promoMessage.text}
                </p>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] shadow-sm p-6">
              <h3 className="font-semibold text-[#1d1d1f] mb-4 tracking-tight">Order Summary</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6e6e73]">Subtotal:</span>
                  <span className="text-[#1d1d1f]">CAD ${rawSubtotal.toLocaleString()}</span>
                </div>
                
                {promoInfo && promoInfo.discountPercent > 0 && (
                  <div className="flex justify-between text-[#34c759]">
                    <span>Discount ({promoInfo.code} -{promoInfo.discountPercent}%):</span>
                    <span>- CAD ${(rawSubtotal - discountedSubtotal).toLocaleString()}</span>
                  </div>
                )}
                
                {promoInfo && (
                  <div className="flex justify-between">
                    <span className="text-[#6e6e73]">Discounted Subtotal:</span>
                    <span className="text-[#1d1d1f]">CAD ${discountedSubtotal.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-[#1d1d1f] font-medium">Build & Price</span>
                  <span className="text-[#1d1d1f]">CAD ${BASE_BUILD_PRICE.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-[#6e6e73]">Subtotal with Build</span>
                  <span className="text-[#1d1d1f]">CAD ${subtotalWithBase.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-[#6e6e73]">Tax ({(config.taxRate * 100).toFixed(0)}%):</span>
                  <span className="text-[#1d1d1f]">CAD ${tax.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-[rgba(0,0,0,0.06)]">
                  <span className="text-[#1d1d1f]">TOTAL:</span>
                  <span className="text-[#1d1d1f]">CAD ${grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Type */}
            <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] shadow-sm p-6">
              <h3 className="font-semibold text-[#1d1d1f] mb-4 tracking-tight">Payment Type</h3>
              
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPaymentType("full")}
                  className={`w-full p-4 rounded-xl border transition-all duration-300 ${
                    paymentType === "full"
                      ? "bg-black text-white border-transparent shadow-md"
                      : "bg-white border-[rgba(0,0,0,0.08)] text-[#1d1d1f] hover:border-black/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Full Payment</span>
                    <span className={`text-sm ${paymentType === "full" ? "text-white/80" : "text-[#6e6e73]"}`}>
                      CAD ${grandTotal.toLocaleString()}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType("partial")}
                  className={`w-full p-4 rounded-xl border transition-all duration-300 ${
                    paymentType === "partial"
                      ? "bg-black text-white border-transparent shadow-md"
                      : "bg-white border-[rgba(0,0,0,0.08)] text-[#1d1d1f] hover:border-black/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">5% Initial Payment</span>
                    <span className={`text-sm ${paymentType === "partial" ? "text-white/80" : "text-[#6e6e73]"}`}>
                      CAD ${(grandTotal * 0.05).toLocaleString()}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* PayPal Button */}
            <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] shadow-sm p-6">
              <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "CAD" }}>
                <PayPalButtons
                  style={{ layout: "horizontal", color: "black", shape: "rect", label: "pay" }}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [{
                        description: "Talishouse Products",
                        amount: {
                          currency_code: "CAD",
                          value: finalAmount.toFixed(2),
                        },
                      }],
                    });
                  }}
                  onApprove={async (data, actions) => {
                    if (actions.order) {
                      const details = await actions.order.capture();
                      console.log("Payment captured:", details);
                      handlePaymentSuccess();
                    }
                  }}
                  onError={(err) => {
                    console.error("PayPal error:", err);
                    alert("Payment failed. Please try again.");
                  }}
                />
              </PayPalScriptProvider>
              <p className="text-xs text-[#6e6e73] text-center mt-4">
                Proceed to Checkout — CAD {finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
