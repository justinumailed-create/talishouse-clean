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
      <div className="fixed inset-0 z-30 pointer-events-none flex justify-end">
        <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={closeCart} />
        <div className="absolute right-0 top-24 bottom-0 w-full max-w-md bg-white shadow-2xl p-6 flex flex-col pointer-events-auto">
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
    <div className="fixed inset-0 z-30 pointer-events-none flex justify-end">
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={closeCart} />
      <div className="absolute right-0 top-24 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col pointer-events-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Your Cart ({items.length})</h2>
          <button onClick={closeCart} className="text-gray-400 hover:text-gray-900 p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <Link href="/catalog" onClick={closeCart} className="text-gray-900 hover:underline font-medium">Browse Products</Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                    <div className="w-20 h-20 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden relative">
                      {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{item.name}</h3>
                      <p className="text-gray-500 text-sm">{formatCAD(item.price)}</p>
                      
                      {item.options && Object.keys(item.options).length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {Object.entries(item.options).map(([key, value]) => (
                            value && (
                              <p key={key} className="text-[10px] text-gray-400 uppercase tracking-tight">
                                <span className="font-semibold">{key}:</span> {value}
                              </p>
                            )
                          ))}
                        </div>
                      )}

                      {item.addons && item.addons.length > 0 && (
                        <div className="mt-1">
                          <p className="text-[10px] text-gray-400 uppercase tracking-tight font-semibold">Add-ons:</p>
                          <p className="text-[10px] text-gray-400 leading-tight">
                            {item.addons.join(", ")}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 border rounded flex items-center justify-center">-</button>
                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 border rounded flex items-center justify-center">+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* SPLITS Toggle */}
               <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-4">
                 <span className="text-sm font-semibold">Splits Required?</span>
                 <button
                   onClick={() => setSplitsEnabled(!splitsEnabled)}
                   className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${splitsEnabled ? "bg-black" : "bg-gray-300"}`}
                 >
                   <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${splitsEnabled ? "translate-x-6" : "translate-x-1"}`} />
                 </button>
               </div>

               {/* SPLITS Jobs */}
               {splitsEnabled && (
               <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
                 <div className="flex items-center justify-between">
                   <h3 className="text-sm font-semibold">SPLITS Allocation (Max 10)</h3>
                  <button
                    onClick={addSplitsJob}
                    disabled={splitsJobs.length >= 10}
                    className="text-xs font-bold text-blue-600 hover:underline disabled:text-gray-400"
                  >
                    + ADD JOB
                  </button>
                </div>

                {splitsJobs.map((job, index) => {
                  const runningTotal = splitsJobs.slice(0, index + 1).reduce((sum, j) => sum + j.amount, 0);
                  return (
                    <div key={index} className="bg-white rounded-xl p-3 border border-gray-100 relative group">
                      <button onClick={() => removeSplitsJob(index)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      <div className="space-y-2">
                        <input
                          type="number"
                          value={job.amount || ""}
                          onChange={(e) => updateSplitsJob(index, { amount: Number(e.target.value) || 0 })}
                          placeholder="Amount (CAD)"
                          className="w-full text-sm font-medium border-b focus:border-black outline-none pb-1"
                        />
                        <textarea
                          value={job.details}
                          onChange={(e) => updateSplitsJob(index, { details: e.target.value })}
                          placeholder="Job details / reference"
                          rows={1}
                          className="w-full text-xs text-gray-500 outline-none resize-none"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider pt-1">
                          <span>Job #{index + 1}</span>
                          <span>Running: {formatCAD(runningTotal)}</span>
                        </div>
                      </div>
                    </div>
                  );
                 })}
               </div>
               )}

             </>
           )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t bg-white space-y-4">
             <div className="space-y-2 text-sm">
               <div className="flex justify-between text-gray-500">
                 <span>Initial Estimated Price:</span>
                 <span>{formatCAD(rawSubtotal)}</span>
               </div>
               <div className="flex justify-between text-gray-500">
                 <span>Destination Charge:</span>
                 <span>{formatCAD(BUILD_AND_PRICE)}</span>
               </div>
               {shippingSelected && (
                 <div className="flex justify-between text-gray-500">
                   <span>Shipping & Custom Clearance:</span>
                   <span>{formatCAD(SHIPPING_CLEARANCE)}</span>
                 </div>
               )}
               <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
                 <span>Subtotal:</span>
                 <span>{formatCAD(subtotalWithCharge + totalDiscount)}</span>
               </div>

               {totalDiscount > 0 && (
                 <div className="flex justify-between items-center bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium mt-2">
                   <span>Discount Applied</span>
                   <span>-{formatCAD(totalDiscount)}</span>
                 </div>
               )}

               {/* Promo Code Input */}
               <div className="pt-2">
                 <div className="flex gap-2">
                   <input
                     type="text"
                     value={promoInput}
                     onChange={(e) => setPromoInput(e.target.value)}
                     placeholder="Discount Code"
                     className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-black transition-colors"
                   />
                   <button
                     onClick={handleApplyPromo}
                     className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-900 transition-colors whitespace-nowrap"
                   >
                     APPLY
                   </button>
                 </div>

                 {promoMessage && promoMessage.type === "error" && (
                   <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-red-500">
                     {promoMessage.text}
                   </p>
                 )}
               </div>

               <div className="flex justify-between text-gray-500 pt-1">
                 <span>Tax:</span>
                 <span>{formatCAD(tax)}</span>
               </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-900">
                <span>Total:</span>
                <span>{formatCAD(totalWithSplits)}</span>
              </div>
            </div>

             <div className="grid grid-cols-3 gap-2">
               <button
                 onClick={() => { setPaymentType("full"); setPaymentStrategy("full"); }}
                 className={`py-3 rounded-xl text-xs font-bold transition-all ${paymentStrategy === "full" ? "bg-black text-white" : "bg-gray-100 text-gray-600"}`}
               >
                 FULL PAYMENT
               </button>
               <button
                 onClick={() => { setPaymentType("partial"); setPaymentStrategy("deposit"); }}
                 className={`py-3 rounded-xl text-xs font-bold transition-all ${paymentStrategy === "deposit" ? "bg-black text-white" : "bg-gray-100 text-gray-600"}`}
               >
                 5% DEPOSIT
               </button>
               <button
                 onClick={() => { setPaymentType("full"); setPaymentStrategy("lto"); }}
                 className={`py-3 rounded-xl text-xs font-bold transition-all ${paymentStrategy === "lto" ? "bg-black text-white" : "bg-gray-100 text-gray-600"}`}
               >
                 LEASE TO OWN
               </button>
             </div>

             {/* LTO Details */}
             {paymentStrategy === "lto" && (
               <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                 <div className="flex justify-between text-sm">
                   <span></span>
                   <span className="font-bold">{formatCAD(totalWithSplits * 0.5)}</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-sm">Term:</span>
                   <select
                     value={ltoTerm}
                     onChange={(e) => { setLtoTerm(Number(e.target.value)); setLtoTermMonths(Number(e.target.value)); }}
                     className="text-sm border rounded-lg px-3 py-1"
                   >
                     <option value={24}>24 months</option>
                     <option value={36}>36 months</option>
                     <option value={48}>48 months</option>
                     <option value={60}>60 months</option>
                   </select>
                 </div>
                 <div className="flex justify-between text-sm pt-2 border-t">
                   <span>Monthly Payment:</span>
                   <span className="font-bold">{formatCAD(ltoMonthlyPayment)}</span>
                 </div>
               </div>
             )}

            {!isCheckingOut ? (
              <button onClick={() => setIsCheckingOut(true)} className="btn-primary w-full py-4 rounded-full font-bold uppercase">
                {paymentStrategy === "deposit" ? "PROCEED WITH DEPOSIT" : paymentStrategy === "lto" ? "PROCEED WITH LEASE-TO-OWN" : "PROCEED TO CHECKOUT"} — {formatCAD(getPaymentAmount())}
              </button>
            ) : (
              <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "CAD" }}>
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
