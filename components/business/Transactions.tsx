"use client";

import { useState } from "react";
import Link from "next/link";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { supabase } from "@/lib/supabase";
import { formatCAD } from "@/utils/currency";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test";

export default function Transactions() {
  const [fastCode, setFastCode] = useState("");
  const [splitsAmount, setSplitsAmount] = useState<number>(1);
  const [splitsDetails, setSplitsDetails] = useState("");
  const [splitsAdditionalFastCode, setSplitsAdditionalFastCode] = useState("");
  const [splitsAdditionalAmounts, setSplitsAdditionalAmounts] = useState("");
  const [splitsAdditionalInfo, setSplitsAdditionalInfo] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [focused, setFocused] = useState(false);

  const MIN_AMOUNT = 1;

  const step1 = fastCode.trim().length > 0 ? 1 : 0;
  const step2 = splitsAmount >= 1 ? 1 : 0;
  const step3 = splitsDetails.trim().length > 0 ? 1 : 0;
  const progress = ((step1 + step2 + step3) / 3) * 100;

  const getPaymentAmount = (): number => {
    const amount = Math.max(splitsAmount, MIN_AMOUNT);
    console.log(`SPLITS PAYING AMOUNT:`, amount);
    return amount;
  };

  const savePayment = async (amount: number) => {
    try {
      const dealPayload = {
        client_name: "SPLITS",
        phone: "",
        project_details: splitsDetails || "SPLITS payment",
        status: "pending",
        fast_code: fastCode.toUpperCase(),
        source: "splits",
        base_price: amount,
      };
      console.log("SPLITS DEAL INSERT - Payload:", JSON.stringify(dealPayload, null, 2));

      const { data: dealData, error: dealError } = await supabase.from("deals_v2").insert([dealPayload]).select().single();

      if (dealError) {
        console.error("SPLITS DEAL INSERT ERROR:", JSON.stringify(dealError, null, 2));
        setPaymentSuccess(true);
        return;
      }
      console.log("SPLITS DEAL INSERT SUCCESS:", JSON.stringify(dealData, null, 2));

      if (dealData) {
        const txPayload = {
          deal_id: dealData.id,
          fast_code: fastCode.toUpperCase(),
          amount: amount,
          payment_type: "splits",
        };
        console.log("SPLITS TRANSACTION INSERT - Payload:", JSON.stringify(txPayload, null, 2));

        const { error: txError } = await supabase.from("transactions").insert([txPayload]);
        if (txError) {
          console.error("SPLITS TRANSACTION INSERT ERROR:", JSON.stringify(txError, null, 2));
        } else {
          console.log("SPLITS TRANSACTION INSERT SUCCESS");
        }
      }

      setPaymentSuccess(true);
    } catch (err) {
      console.error("Save payment failed:", err);
      setPaymentSuccess(true);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePayPalApprove = async (_data: any, actions: any) => {
    await actions.order.capture();
    const amount = getPaymentAmount();
    console.log(`SPLITS PAYPAL CAPTURE AMOUNT:`, amount);
    await savePayment(amount);
  };

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
              SPLITS Recorded
            </h2>
            <p className="text-[#6e6e73] mb-6">
              FAST Code: <span className="font-semibold">{fastCode.toUpperCase()}</span>
            </p>
            <Link href="/business-office" className="btn-primary inline-block">
              Return to Business Office
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-[#f5f5f7] py-12">
      <div className="mx-auto max-w-2xl">
        <Link 
          href="/business-office" 
          className="inline-flex items-center text-sm text-[#6e6e73] hover:text-[#0070ba] transition-colors mb-6"
        >
          ← Back to Business Office
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-[rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300">
          <div className="bg-[linear-gradient(135deg,#0070ba,#1546a0)] px-6 py-5 text-white">
            <h1 className="text-xl font-semibold tracking-wide">
              SPLITS Portal
            </h1>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT: Info */}
              <div className="bg-[#f5f5f7] rounded-2xl p-6">
                <h3 className="font-semibold text-[#1d1d1f] mb-4 tracking-tight">
                  For SPLITS Transactions
                </h3>
                <p className="text-3xl font-semibold text-[#0070ba] mb-4">${MIN_AMOUNT.toFixed(2)}</p>
                
                <div className="space-y-4 text-sm text-[#6e6e73]">
                  <p>
                    <strong className="text-[#1d1d1f]">SPLITS</strong> facilitates Business Office eCommerce for value added and pass-through revenues.
                  </p>
                    
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-[#6e6e73] mb-1">
                      <span>Setup Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-[rgba(0,0,0,0.08)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[linear-gradient(90deg,#0070ba,#1546a0)] transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm">
                      Enter your <b>FAST Code</b> — for transaction attribution
                    </p>

                    <p className="text-sm">
                      SPLITS Amount — {formatCAD(splitsAmount)}
                    </p>

                    <p className="text-sm">
                      Add SPLITS Details — for pre-approval clarity
                    </p>
                  </div>

                  <div className="bg-[rgba(0,112,186,0.08)] rounded-xl p-4">
                    <p className="text-[#0070ba] text-xs">
                      All transactions are processed securely through PayPal
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT: Form */}
              <div className="bg-white">
                <form className="space-y-5">
                  {/* FAST Code */}
                  <div>
                    <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                      FAST Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fastCode}
                      onChange={(e) => setFastCode(e.target.value.toUpperCase())}
                      placeholder="e.g. FAST-ABC123"
                      className="w-full px-4 py-3 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white text-sm outline-none transition-all duration-200 focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/20"
                    />
                    <p className="text-xs text-[#6e6e73] mt-1">
                      For transaction attribution
                    </p>
                  </div>

                  {/* SPLITS Amount */}
                  <div className="w-full">
                    <label className="block text-sm text-[#6e6e73] mb-2">
                      SPLITS Amount (CAD)
                    </label>

                    <div
                      className={`
                        relative flex items-center rounded-xl border transition-all duration-200
                        ${focused ? "border-[#0070ba] shadow-sm" : "border-[rgba(0,0,0,0.08)]"}
                        bg-white
                      `}
                    >
                      <span className="pl-4 pr-2 text-[#6e6e73] text-base">$</span>

                      <input
                        type="number"
                        min={1}
                        step="1"
                        value={splitsAmount}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSplitsAmount(val < 1 ? 1 : val);
                        }}
                        className="
                          w-full py-3 pr-10 bg-transparent outline-none text-base
                          appearance-none
                        "
                      />

                      <div className="flex flex-col pr-2">
                        <button
                          type="button"
                          onClick={() => setSplitsAmount((prev) => prev + 1)}
                          className="text-[#6e6e73] hover:text-[#0070ba] transition text-xs leading-none"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => setSplitsAmount((prev) => Math.max(1, prev - 1))}
                          className="text-[#6e6e73] hover:text-[#0070ba] transition text-xs leading-none"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SPLITS Details */}
                  <div>
                    <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                      SPLITS Details
                    </label>
                    <textarea
                      value={splitsDetails}
                      onChange={(e) => setSplitsDetails(e.target.value)}
                      placeholder="Enter SPLITS details to simplify pre-approvals..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white text-sm outline-none transition-all duration-200 focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/20 resize-none"
                    />
                    <p className="text-xs text-[#6e6e73] mt-1">
                      Optional details for pre-approvals
                    </p>
                  </div>

                  {/* Additional Info Section */}
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-600 bg-[#f5f5f7] px-3 py-2 rounded-xl mb-4">
                      Additional info
                    </h3>

                    {/* FAST Code */}
                    <div className="mb-4">
                      <label className="block text-sm text-gray-700 mb-1">
                        Please enter FAST Code, if applicable{" "}
                        <span className="text-gray-400">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={splitsAdditionalFastCode}
                        onChange={(e) => setSplitsAdditionalFastCode(e.target.value)}
                        className="w-full border border-[#d2d2d7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070ba]/20"
                      />
                    </div>

                    {/* SPLITS Amounts */}
                    <div className="mb-4">
                      <label className="block text-sm text-gray-700 mb-1">
                        Please enter SPLITS Amounts, if applicable{" "}
                        <span className="text-gray-400">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={splitsAdditionalAmounts}
                        onChange={(e) => setSplitsAdditionalAmounts(e.target.value)}
                        className="w-full border border-[#d2d2d7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070ba]/20"
                      />
                    </div>

                    {/* SPLITS Info */}
                    <div className="mb-4">
                      <label className="block text-sm text-gray-700 mb-1">
                        Please detail SPLITS Information, if applicable{" "}
                        <span className="text-gray-400">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={splitsAdditionalInfo}
                        onChange={(e) => setSplitsAdditionalInfo(e.target.value)}
                        className="w-full border border-[#d2d2d7] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0070ba]/20"
                      />
                    </div>
                  </div>

                  {/* PayPal Button */}
                  <PayPalScriptProvider
                    options={{
                      clientId: PAYPAL_CLIENT_ID,
                      currency: "CAD",
                    }}
                  >
                    <PayPalButtons
                      style={{ layout: "horizontal", color: "blue", shape: "rect", label: "pay" }}
                      createOrder={(_, actions) => {
                        const amount = getPaymentAmount();
                        console.log(`SPLITS PAYPAL CREATE ORDER AMOUNT:`, amount);
                        return actions.order.create({
                          intent: "CAPTURE",
                          purchase_units: [
                            {
                              amount: {
                                currency_code: "CAD",
                                value: amount.toFixed(2),
                              },
                            },
                          ],
                        });
                      }}
                      onApprove={handlePayPalApprove}
                      onError={() => {
                        alert("Payment failed. Please try again.");
                      }}
                      onClick={() => {
                        if (!fastCode.trim()) {
                          alert("Please enter your FAST Code");
                        }
                      }}
                    />
                  </PayPalScriptProvider>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
