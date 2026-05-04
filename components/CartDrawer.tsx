"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart, PaymentStrategy, SHIPPING_CLEARANCE, BUILD_AND_PRICE, PromoCode } from "@/context/CartContext";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { supabase } from "@/lib/supabase";
import { syncTransactionToSplits } from "@/lib/splits";
import { getPricingConfig, calculateLeaseToOwn } from "@/lib/utils/pricingEngine";
import { DISCOUNT_CODES, formatDiscount } from "@/lib/utils/discounts";
import { formatCAD } from "@/utils/currency";
import { UI } from "@/styles/design-system";
import { addonsRecord } from "@/lib/config/addons";

const DEFAULT_PRODUCT_IMAGE = "/images/placeholder.png";



export default function CartDrawer() {
  const config = getPricingConfig();
  
  const {
    items,
    isOpen,
    closeCart,
    rawSubtotal,
    discountedSubtotal,
    subtotalWithCharge,
    tax,
    grandTotal,
    promoCode,
    promoInfo,
    appliedDiscounts,
    totalDiscount,
    removePromoCode,
    setDiscount,
    paymentStrategy,
    ltoTermMonths,
    ltoMonthlyPayment,
    shippingSelected,
    setPaymentStrategy,
    setLtoTermMonths,
    getPaymentAmount,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyPromoCode,
    stackConfig,
    splitsAmount,
    splitsJobs,
    addSplitsJob,
    removeSplitsJob,
    updateSplitsJob,
  } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [promoMessage, setPromoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync promoInput with applied promoCode when drawer opens
  useEffect(() => {
    if (isOpen && promoCode) {
      setPromoInput(promoCode);
    }
  }, [isOpen, promoCode]);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<typeof items>([]);
  const [paymentType, setPaymentType] = useState<"full" | "partial">("full");
  const [ltoTerm, setLtoTerm] = useState(36);
  const [splitsEnabled, setSplitsEnabled] = useState(false);

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    const result = applyPromoCode(promoInput.trim());
    setPromoMessage({ type: result.success ? "success" : "error", text: result.message });
  };

  const savePayment = async (transactionId: string) => {
    try {
      const paymentPayload = {
        product_name: items.map(i => i.name).join(", "),
        amount: getPaymentAmount(),
        user_name: "Cart Purchase",
        status: paymentStrategy === "deposit" ? "deposit" : paymentStrategy === "lto" ? "lto" : "completed",
      };

      const { error: paymentError } = await supabase.from("payments").insert([paymentPayload]);
      
      const fastCode = promoCode || "DIRECT";
      const basePrice = rawSubtotal;

      const dealPayload = {
        client_name: "Cart Purchase",
        phone: "",
        project_details: items.map(i => `${i.name} x${i.quantity}`).join(", "),
        status: "new",
        fast_code: fastCode,
        source: "cart",
        base_price: basePrice,
        addons_value: 0,
        splits_amount: splitsAmount || undefined,
        splits_details: JSON.stringify(splitsJobs),
      };

      const { data: dealData, error: dealError } = await supabase.from("deals_v2").insert([dealPayload]).select().single();

      if (dealError) {
        console.error("DEAL INSERT ERROR:", dealError);
        return;
      }

      if (dealData) {
        const txPayload = {
          deal_id: dealData.id,
          fast_code: fastCode,
          amount: getPaymentAmount(),
          payment_type: paymentStrategy,
        };

        await supabase.from("transactions").insert([txPayload]);

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

  const totalWithSplits = grandTotal + splitsAmount;
  const paymentAmount = paymentStrategy === "deposit" ? totalWithSplits * 0.05 : paymentStrategy === "lto" ? totalWithSplits * 0.5 : totalWithSplits;

  if (!isOpen) return null;

  if (paymentSuccess) {
    return (
      <div className="fixed inset-0 z-30 pointer-events-none flex justify-end overflow-y-auto">
        <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={closeCart} />
        <div className="relative top-24 h-fit min-h-[400px] w-full max-w-md bg-white shadow-2xl p-6 flex flex-col pointer-events-auto mb-24">
          <button onClick={closeCart} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Payment Successful!</h2>
            <Link href="/" onClick={closeCart} className="btn-primary mt-6">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-30 pointer-events-none flex justify-end overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={closeCart} />
      <div className="relative top-24 h-fit w-full max-w-md bg-white shadow-2xl flex flex-col pointer-events-auto mb-24">
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold">Your Cart ({items.length})</h2>
          <button onClick={closeCart} className="text-gray-400 hover:text-gray-900 p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <Link href="/catalog" onClick={closeCart} className="text-gray-900 hover:underline font-medium">Browse Products</Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ITEM LOOP */}
              {items.map((item) => (
                <div key={item.id} className="space-y-4">
                  {/* 1. PRODUCT BLOCK (TOP - SINGLE CARD) */}
                  <div className="flex gap-4 items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="w-20 h-20 bg-white rounded-xl flex-shrink-0 overflow-hidden relative border border-gray-100 shadow-sm">
                      {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-sm text-gray-900 leading-tight truncate">{item.name}</h3>
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 py-0.5 shadow-sm">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-black transition-colors">-</button>
                          <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-black transition-colors">+</button>
                        </div>
                      </div>
                      <p className="text-black font-bold text-sm">{formatCAD(item.price)}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* 3. SPLITS SECTION (BELOW CONFIG) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                   <div className="space-y-0.5">
                     <span className="text-sm font-bold text-gray-900">Splits Required?</span>
                     <p className="text-[10px] text-gray-400 font-medium leading-none">Distribute payments across jobs</p>
                   </div>
                   <button
                     onClick={() => setSplitsEnabled(!splitsEnabled)}
                     className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${splitsEnabled ? "bg-black" : "bg-gray-200"}`}
                   >
                     <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${splitsEnabled ? "translate-x-6" : "translate-x-1"}`} />
                   </button>
                 </div>

                 {splitsEnabled && (
                 <div className="bg-gray-50 rounded-2xl p-4 space-y-4 border border-gray-100">
                   <div className="flex items-center justify-between">
                     <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Allocation</h3>
                      <button
                        onClick={addSplitsJob}
                        disabled={splitsJobs.length >= 10}
                        className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider disabled:text-gray-300"
                      >
                        + Add Job
                      </button>
                    </div>

                    {splitsJobs.map((job, index) => {
                      const runningTotal = splitsJobs.slice(0, index + 1).reduce((sum, j) => sum + j.amount, 0);
                      return (
                        <div key={index} className="bg-white rounded-xl p-3 border border-gray-100 relative shadow-sm">
                          <button onClick={() => removeSplitsJob(index)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          <div className="space-y-2">
                            <div className="flex items-center border-b border-gray-50 pb-1.5">
                              <span className="text-gray-400 text-sm mr-2">$</span>
                              <input
                                type="number"
                                value={job.amount || ""}
                                onChange={(e) => updateSplitsJob(index, { amount: Number(e.target.value) || 0 })}
                                placeholder="Amount (CAD)"
                                className="w-full text-sm font-bold text-gray-900 outline-none placeholder:text-gray-300"
                              />
                            </div>
                            <textarea
                              value={job.details}
                              onChange={(e) => updateSplitsJob(index, { details: e.target.value })}
                              placeholder="Job details / reference"
                              rows={1}
                              className="w-full text-xs text-gray-500 outline-none resize-none placeholder:text-gray-300"
                            />
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider pt-1.5 border-t border-gray-50">
                              <span className="text-gray-400">Job #{index + 1}</span>
                              <span className="text-gray-900 bg-gray-50 px-2 py-0.5 rounded-md">Running: {formatCAD(runningTotal)}</span>
                            </div>
                          </div>
                        </div>
                      );
                     })}
                   </div>
                 )}
              </div>

              {/* 4. PRICING SUMMARY (BELOW SPLITS) */}
              <div className="bg-gray-50 rounded-2xl p-5 space-y-4 border border-gray-100 shadow-sm">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-gray-500 text-sm">
                    <span>Initial Price</span>
                    <span className="text-gray-900 font-medium">{formatCAD(rawSubtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 text-sm">
                    <span>Destination Charge</span>
                    <span className="text-gray-900 font-medium">{formatCAD(BUILD_AND_PRICE)}</span>
                  </div>

                  {/* ITEM SELECTIONS & ADD-ONS BREAKDOWN */}
                  {items.map((item) => (
                    <div key={`breakdown-${item.id}`} className="space-y-1.5 pt-1 border-t border-gray-100/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">{item.name}</p>
                      {/* Options */}
                      {item.options && Object.entries(item.options).map(([key, value]) => (
                        value && (
                          <div key={key} className="flex justify-between items-center text-gray-400 text-[11px] px-1">
                            <span>{key}: {value}</span>
                            <span>Included</span>
                          </div>
                        )
                      ))}
                      {/* Add-ons */}
                      {item.addons && item.addons.map((addonNameOrId) => {
                        const addon = addonsRecord[addonNameOrId] || Object.values(addonsRecord).find(a => a.name === addonNameOrId);
                        if (!addon) return null;
                        return (
                          <div key={addon.id} className="flex justify-between items-center text-gray-400 text-[11px] px-1">
                            <span>{addon.name}</span>
                            <span>{formatCAD(addon.price)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  
                  <div className="pt-2 border-t border-gray-200 space-y-2.5">
                    <div className="flex justify-between items-center text-gray-900 font-semibold text-sm">
                      <span>Subtotal</span>
                      <span>{formatCAD(subtotalWithCharge + totalDiscount)}</span>
                    </div>

                    {totalDiscount > 0 && (
                      <div className="flex justify-between items-center bg-green-50 text-green-700 px-3 py-1.5 rounded-xl text-[11px] font-bold border border-green-100">
                        <div className="flex items-center gap-2">
                          <span>Discount Applied</span>
                          <button 
                            onClick={() => { removePromoCode(); setPromoInput(""); }}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Remove Discount"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        </div>
                        <span>-{formatCAD(totalDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-gray-500 text-sm">
                      <span>Tax (14%)</span>
                      <span className="text-gray-900 font-medium">{formatCAD(tax)}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <span className="text-xl font-black text-gray-900">{formatCAD(totalWithSplits)}</span>
                  </div>
                </div>

                {/* Promo Code Input */}
                <div className="pt-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Discount Code"
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-black transition-colors shadow-sm"
                    />
                    <button
                      onClick={handleApplyPromo}
                      className="bg-black text-white px-5 py-2.5 rounded-xl text-[11px] font-black hover:bg-gray-800 transition-colors uppercase tracking-widest"
                    >
                      Apply
                    </button>
                  </div>
                  {promoMessage && promoMessage.type === "error" && (
                    <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-tight ml-1">
                      {promoMessage.text}
                    </p>
                  )}
                </div>
              </div>

              {/* 5. PAYMENT SECTION (BELOW PRICING) */}
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-2xl">
                  <button
                    onClick={() => { setPaymentType("partial"); setPaymentStrategy("deposit"); }}
                    className={`py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-wider ${paymentStrategy === "deposit" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    5% Deposit
                  </button>
                  <button
                    onClick={() => { setPaymentType("full"); setPaymentStrategy("lto"); }}
                    className={`py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-wider ${paymentStrategy === "lto" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    Lease-to-Own
                  </button>
                  <button
                    onClick={() => { setPaymentType("full"); setPaymentStrategy("full"); }}
                    className={`py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-wider ${paymentStrategy === "full" ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    Full Payment
                  </button>
                </div>

                {/* LTO Details */}
                {paymentStrategy === "lto" && (
                  <div className="bg-black text-white rounded-2xl p-5 space-y-4 shadow-lg animate-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Down Payment (50%)</span>
                      <span className="text-lg font-black">{formatCAD(totalWithSplits * 0.5)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Term</span>
                      <select
                        value={ltoTerm}
                        onChange={(e) => { setLtoTerm(Number(e.target.value)); setLtoTermMonths(Number(e.target.value)); }}
                        className="bg-white/10 text-white text-[11px] font-black border-none rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-white/20"
                      >
                        <option value={24} className="text-black">24 Months</option>
                        <option value={36} className="text-black">36 Months</option>
                        <option value={48} className="text-black">48 Months</option>
                        <option value={60} className="text-black">60 Months</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-white/10">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Monthly</span>
                      <span className="text-lg font-black text-white">{formatCAD(ltoMonthlyPayment)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 6. CHECKOUT BAR (STICKY BOTTOM) */}
        {items.length > 0 && (
          <div className="p-6 border-t bg-white flex-shrink-0">
            {!isCheckingOut ? (
              <button 
                onClick={() => setIsCheckingOut(true)} 
                className="w-full bg-black text-white py-4.5 rounded-2xl font-black text-[13px] uppercase tracking-[0.15em] hover:bg-gray-900 transition-all shadow-xl active:scale-[0.98]"
              >
                {paymentStrategy === "deposit" ? "Pay Deposit" : paymentStrategy === "lto" ? "Start Lease" : "Proceed to Checkout"} — {formatCAD(getPaymentAmount())}
              </button>
            ) : (
              <PayPalScriptProvider
              options={{
                clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
                currency: "CAD",
                intent: "capture"
              }}
            >
                <PayPalButtons
                  style={{ layout: "horizontal", color: "black", shape: "pill", label: "checkout" }}
                  createOrder={(data, actions) => actions.order.create({
                    intent: "CAPTURE",
                    purchase_units: [{ amount: { currency_code: "CAD", value: paymentAmount.toFixed(2) } }]
                  })}
                  onApprove={async (data, actions) => {
                    const details = await actions?.order?.capture();
                    await savePayment(details?.id || "");
                    handlePaymentSuccess();
                  }}
                />
              </PayPalScriptProvider>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
