"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { supabase } from "@/lib/supabase";
import { formatCAD } from "@/utils/currency";
import { isAuthorized } from "@/lib/fast-code";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test";

export default function Transactions() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [fastCode, setFastCode] = useState("");
  const [splitsAmount, setSplitsAmount] = useState("");
  const [splitsDetails, setSplitsDetails] = useState("");
  const [splitsAdditionalAmounts, setSplitsAdditionalAmounts] = useState("");
  const [splitsAdditionalInfo, setSplitsAdditionalInfo] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setAuthorized(isAuthorized());
  }, []);

  useEffect(() => {
    if (authorized === false) {
      window.location.href = "/business-office";
    }
  }, [authorized]);

  const MIN_AMOUNT = 1;

  const step1 = fastCode.trim().length > 0 ? 1 : 0;
  const step2 = Number(splitsAmount) >= 1 ? 1 : 0;
  const step3 = splitsDetails.trim().length > 0 ? 1 : 0;
  const progress = ((step1 + step2 + step3) / 3) * 100;

  const getPaymentAmount = (): number => {
    const amount = Math.max(Number(splitsAmount) || 0, MIN_AMOUNT);
    console.log("SPLITS PAYING AMOUNT:", amount);
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
    console.log("SPLITS PAYPAL CAPTURE AMOUNT:", amount);
    await savePayment(amount);
  };

  if (authorized === null) {
    return null;
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-[70vh] bg-white py-12">
        <div className="w-full px-6">
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
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-white py-12">
      <div className="w-full px-6">
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
                E-commerce Portal
              </h1>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT: Info */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="space-y-4 text-sm text-[#6e6e73]">
                    <p className="leading-relaxed">
                      E-commerce transaction tracking system with integrated reward attribution and payment handling.
                    </p>
                      
                    <div className="py-4">
                      <div className="flex justify-between text-xs text-[#6e6e73] mb-1">
                        <span>Form Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full h-2 bg-[rgba(0,0,0,0.08)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[linear-gradient(90deg,#0070ba,#1546a0)] transition-all duration-500 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Form */}
                <div className="bg-white">
                  <form className="space-y-5">
                    {/* FAST Code */}
                    <div>
                      <label className="block text-sm font-semibold text-[#1d1d1f] mb-1.5">
                        FAST Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fastCode}
                        onChange={(e) => setFastCode(e.target.value.toUpperCase())}
                        placeholder="Used to attribute transactions & rewards"
                        className="w-full px-4 py-3 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white text-sm outline-none transition-all duration-200 focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/20"
                        required
                      />
                    </div>

                    {/* SPLITS COST */}
                    <div className="w-full">
                      <label className="block text-sm font-semibold text-[#1d1d1f] mb-1.5">
                        SPLITS COST <span className="text-red-500">*</span>
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
                          type="text"
                          value={splitsAmount}
                          onFocus={() => {
                            setFocused(true);
                          }}
                          onBlur={() => setFocused(false)}
                          onChange={(e) => setSplitsAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                          placeholder="0.00"
                          className="w-full py-3 pr-4 bg-transparent outline-none text-base"
                          required
                        />
                      </div>
                    </div>

                    {/* Discount Code */}
                    <div>
                      <label className="block text-sm font-semibold text-[#1d1d1f] mb-1.5">
                        Discount Code <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={splitsAdditionalInfo}
                        onChange={(e) => setSplitsAdditionalInfo(e.target.value)}
                        placeholder="Enter discount or promo code"
                        className="w-full px-4 py-3 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white text-sm outline-none transition-all duration-200 focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/20"
                      />
                    </div>

                    {/* SPLITS details */}
                    <div>
                      <label className="block text-sm font-semibold text-[#1d1d1f] mb-1.5">
                        SPLITS details <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={splitsDetails}
                        onChange={(e) => setSplitsDetails(e.target.value.slice(0, 1000))}
                        placeholder="Enter transaction details or notes..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white text-sm outline-none transition-all duration-200 focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/20 resize-none"
                        required
                      />
                      <div className="flex justify-between mt-1">
                        <p className="text-[10px] text-[#6e6e73]">
                          Briefly detail the project lead source.
                        </p>
                        <p className={`text-[10px] ${splitsDetails.length >= 1000 ? "text-red-500" : "text-[#6e6e73]"}`}>
                          {splitsDetails.length}/1000
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[rgba(0,0,0,0.06)]">
                      <p className="text-xs font-medium text-[#1d1d1f] mb-3 text-center">
                        Submit Transaction
                      </p>
                      {/* PayPal Button Container */}
                      <div className="relative z-10">
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
                            onClick={(data, actions) => {
                              if (!fastCode.trim()) {
                                alert("Please enter FAST code");
                                return actions.reject();
                              }
                              if (!splitsAmount) {
                                alert("Please enter transaction amount");
                                return actions.reject();
                              }
                              if (!splitsDetails.trim()) {
                                alert("Please enter details");
                                return actions.reject();
                              }
                            }}
                          />
                        </PayPalScriptProvider>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
