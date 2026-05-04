"use client";

import { useEffect, useState } from "react";
import { getFastCode } from "@/lib/fast-code";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { formatCAD } from "@/utils/currency";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
console.log("PAYPAL CLIENT ID:", PAYPAL_CLIENT_ID);

interface SubscriptionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  type: "referral" | "wholesale";
}

export default function SubscriptionDrawer({ isOpen, onClose, type }: SubscriptionDrawerProps) {
  const [fastCode, setFastCodeState] = useState("");

  useEffect(() => {
    const code = getFastCode();
    if (code) {
      setFastCodeState(code);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isReferral = type === "referral";

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl overflow-y-auto">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
              View Details
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
            >
              ×
            </button>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {isReferral ? "Subscribe as Referral Partner" : "Register as Wholesale Partner"}
          </h2>

          <div className="mb-4">
            {isReferral ? (
              <>
                <p className="text-3xl font-bold text-gray-900">{formatCAD(95)}/mo</p>
                <p className="text-sm text-gray-500 mt-1">Then, starting in 1 month, {formatCAD(95)}/mo</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">{formatCAD(1995)}</p>
                <p className="text-sm text-gray-500 mt-1">One-time registration fee</p>
              </>
            )}
          </div>

          <div className="space-y-6 text-gray-600 max-w-sm leading-relaxed">
            {isReferral ? (
              <>
                <p>
                  Subscribe as a Referral Partner to start earning commissions on referred projects.
                </p>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Benefits:
                  </h3>
                  <ul className="space-y-2.5">
                    <li>Commission-based referral fees</li>
                    <li>Access to exclusive project leads</li>
                    <li>Marketing materials and support</li>
                    <li>Real-time referral tracking dashboard</li>
                    <li>Priority support from our team</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <p>
                  Register as a Wholesale Partner for bulk pricing and volume discounts on Talishouse™ products.
                </p>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Benefits:
                  </h3>
                  <ul className="space-y-2.5">
                    <li>Wholesale pricing on all units</li>
                    <li>Volume discounts and tiered pricing</li>
                    <li>Priority manufacturing scheduling</li>
                    <li>Dedicated account manager</li>
                    <li>Early access to new product lines</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          <div className="mt-8">
            <PayPalScriptProvider options={{ "client-id": PAYPAL_CLIENT_ID, vault: true, intent: "subscription" }}>
              {isReferral ? (
                <PayPalButtons
                  style={{ shape: "pill", color: "black", layout: "horizontal", label: "subscribe" }}
                  createSubscription={(data, actions) => {
                    return actions.subscription.create({
                      plan_id: "P-8VX74484S9432983MNG55CRI",
                    });
                  }}
                  onApprove={async (data) => {
                    window.location.href = "/success?subscription_id=" + data.subscriptionID;
                  }}
                />
              ) : (
                <PayPalButtons
                  style={{ shape: "pill", color: "black", layout: "horizontal", label: "subscribe" }}
                  createSubscription={(data, actions) => {
                    return actions.subscription.create({
                      plan_id: "P-8T371356N79130635NG55HAI",
                    });
                  }}
                  onApprove={async (data) => {
                    window.location.href = "/success?plan=wholesale&subscription_id=" + data.subscriptionID;
                  }}
                />
              )}
            </PayPalScriptProvider>

            <p className="text-xs text-gray-400 text-center mt-4">
              {isReferral 
                ? "Cancel anytime. Commission rates vary by project type."
                : "Volume pricing available. Contact us for enterprise deals."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
