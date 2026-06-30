"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { ChevronDown } from "lucide-react";
import { formatCAD } from "@/utils/currency";
import { processPayment } from "@/app/talispros/register/payment-actions";
import { routeRegistrationByFastCode } from "@/app/talispros/register/fast-code-actions";
import { setFastCode } from "@/lib/fast-code";
import type { OfferedSubscriptionTier } from "@/lib/mapsite-subscription";
import {
  ADPRO_PLANS,
  PLAN_DETAILS,
  registrationTotalFor,
  type PlanType,
} from "@/lib/registration-plans";

interface RootAccountRegistrationFormProps {
  variant?: "page" | "panel";
  allowedTier?: OfferedSubscriptionTier;
  parentFastCode?: string;
}

export default function RootAccountRegistrationForm({
  variant = "page",
  allowedTier,
  parentFastCode,
}: RootAccountRegistrationFormProps) {
  const router = useRouter();
  const isPanel = variant === "panel";
  const showRoot = !allowedTier || allowedTier === "root";
  const showDerivative = !allowedTier || allowedTier === "derivative";
  const showAdpro = !allowedTier || allowedTier === "adpro";

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paypalKey, setPaypalKey] = useState(0);
  const [adproExpanded, setAdproExpanded] = useState(
    allowedTier === "adpro"
  );
  const [accountCategory, setAccountCategory] = useState<
    "root" | "derivative" | "adpro"
  >(allowedTier ?? "root");
  const [sponsorFastCode, setSponsorFastCode] = useState("");
  const [routingFastCode, setRoutingFastCode] = useState(false);

  const isAdpro = accountCategory === "adpro";
  const showFastCodeRouting =
    allowedTier === "root" || allowedTier === "derivative";

  async function handleFastCodeRouting() {
    if (!allowedTier) return;
    const code = sponsorFastCode.trim();
    if (!code) {
      setError("Enter a FAST Code to continue.");
      return;
    }

    setRoutingFastCode(true);
    setError("");

    const result = await routeRegistrationByFastCode(code, allowedTier);
    if (result.ok) {
      router.push(result.redirectTo);
      return;
    }

    setError(result.error);
    setRoutingFastCode(false);
  }

  function validate(): string | null {
    if (!firstName.trim()) return "First name is required";
    if (!lastName.trim()) return "Last name is required";
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "Valid email is required";
    return null;
  }

  async function handlePaypalApprove(
    planType: PlanType,
    details: { id: string; captureId?: string }
  ) {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setProcessing(true);

    const result = await processPayment({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      planType,
      paypalOrderId: details.id,
      paypalCaptureId: details.captureId || details.id,
    });

    if (result.success && result.redirectUrl) {
      if (result.fastCode) {
        setFastCode(result.fastCode);
      }
      window.dispatchEvent(new CustomEvent("mapsite:root-account-registered"));
      router.push(result.redirectUrl);
      return;
    }

    setError(result.error || "Payment processing failed. Please contact support.");
    setProcessing(false);
    setPaypalKey((k) => k + 1);
  }

  const inputClass = isPanel
    ? "w-full h-10 px-3 bg-white border border-neutral-200 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
    : "w-full h-11 px-4 bg-white border border-neutral-200 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20";

  const cardClass = (active: boolean) =>
    `rounded-xl border-2 transition-all ${
      active
        ? "border-neutral-900 shadow-sm"
        : "border-neutral-200 hover:border-neutral-300"
    }`;

  return (
    <>
      {error && (
        <div
          className={`${isPanel ? "mb-3" : "mb-6"} p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700`}
        >
          {error}
        </div>
      )}

      <div className={isPanel ? "space-y-4" : "space-y-5"}>
        {parentFastCode && (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            Registering under sponsor FAST Code{" "}
            <span className="font-mono font-semibold text-neutral-900">
              {parentFastCode.toUpperCase()}
            </span>
            .
          </div>
        )}

        {showFastCodeRouting && (
          <div className={`bg-white rounded-xl border border-neutral-200 ${isPanel ? "p-4" : "p-6 sm:p-8 shadow-sm"}`}>
            <h3 className={`font-semibold text-neutral-900 ${isPanel ? "text-sm mb-2" : "text-lg mb-2"}`}>
              FAST Code™
            </h3>
            <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
              {allowedTier === "root"
                ? "Enter your sponsor's Root Account™ FAST Code to register as a Derivative Account™ instead."
                : "Enter your sponsor's Derivative Account™ FAST Code to register as an AdPro™ account instead."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={sponsorFastCode}
                onChange={(e) => setSponsorFastCode(e.target.value.toUpperCase())}
                placeholder="Enter FAST Code"
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleFastCodeRouting}
                disabled={routingFastCode}
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-neutral-900 px-6 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
              >
                {routingFastCode ? "Checking..." : "Continue"}
              </button>
            </div>
          </div>
        )}

        <div className={`bg-white rounded-xl border border-neutral-200 ${isPanel ? "p-4" : "p-6 sm:p-8 shadow-sm"}`}>
          <h3 className={`font-semibold text-neutral-900 ${isPanel ? "text-sm mb-3" : "text-lg mb-5"}`}>
            Personal Info
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1 block">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1 block">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <PayPalScriptProvider
          key={paypalKey}
          options={{
            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
            currency: "CAD",
            intent: "capture",
          }}
        >
          <div className={isPanel ? "space-y-3" : "space-y-6"}>
            {showRoot && (
            <div
              className={cardClass(accountCategory === "root" && !isAdpro)}
              onClick={() => setAccountCategory("root")}
            >
              <div className={isPanel ? "p-4" : "p-6 sm:p-8"}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className={`font-semibold text-neutral-900 ${isPanel ? "text-sm" : "text-xl"}`}>
                      Root Account™
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      {PLAN_DETAILS.ROOT_ACCOUNT.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-bold text-neutral-900 ${isPanel ? "text-sm" : "text-lg"}`}>
                      {formatCAD(PLAN_DETAILS.ROOT_ACCOUNT.price)}
                    </div>
                    <div className="text-[10px] text-neutral-400">setup</div>
                  </div>
                </div>
                {!isPanel && (
                  <ul className="space-y-1.5 mb-4">
                    {PLAN_DETAILS.ROOT_ACCOUNT.bullets!.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm text-neutral-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
                <PayPalButtons
                  style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay", height: isPanel ? 40 : 45 }}
                  createOrder={(_data, actions) =>
                    actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [
                        {
                          description: "Root Account™ Registration",
                          amount: {
                            currency_code: "CAD",
                            value: registrationTotalFor(
                              PLAN_DETAILS.ROOT_ACCOUNT.price
                            ).toFixed(2),
                          },
                        },
                      ],
                    })
                  }
                  onApprove={async (_data, actions) => {
                    if (actions.order) {
                      const details = await actions.order.capture();
                      await handlePaypalApprove("ROOT_ACCOUNT", {
                        id: details.id || "",
                        captureId:
                          details.purchase_units?.[0]?.payments?.captures?.[0]
                            ?.id,
                      });
                    }
                  }}
                  onError={() => {
                    setError("Payment failed. Please try again.");
                    setPaypalKey((k) => k + 1);
                  }}
                />
              </div>
            </div>
            )}

            {showDerivative && (
            <div
              className={cardClass(accountCategory === "derivative")}
              onClick={() => setAccountCategory("derivative")}
            >
              <div className={isPanel ? "p-4" : "p-6 sm:p-8"}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className={`font-semibold text-neutral-900 ${isPanel ? "text-sm" : "text-xl"}`}>
                      Derivative Account™
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      {PLAN_DETAILS.DERIVATIVE_ACCOUNT.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-bold text-neutral-900 ${isPanel ? "text-sm" : "text-lg"}`}>
                      {formatCAD(PLAN_DETAILS.DERIVATIVE_ACCOUNT.price)}
                    </div>
                    <div className="text-[10px] text-neutral-400">setup</div>
                  </div>
                </div>
                <PayPalButtons
                  style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay", height: isPanel ? 40 : 45 }}
                  createOrder={(_data, actions) =>
                    actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [
                        {
                          description: "Derivative Account™ Registration",
                          amount: {
                            currency_code: "CAD",
                            value: registrationTotalFor(
                              PLAN_DETAILS.DERIVATIVE_ACCOUNT.price
                            ).toFixed(2),
                          },
                        },
                      ],
                    })
                  }
                  onApprove={async (_data, actions) => {
                    if (actions.order) {
                      const details = await actions.order.capture();
                      await handlePaypalApprove("DERIVATIVE_ACCOUNT", {
                        id: details.id || "",
                        captureId:
                          details.purchase_units?.[0]?.payments?.captures?.[0]
                            ?.id,
                      });
                    }
                  }}
                  onError={() => {
                    setError("Payment failed. Please try again.");
                    setPaypalKey((k) => k + 1);
                  }}
                />
              </div>
            </div>
            )}

            {showAdpro && (
            <div className={cardClass(isAdpro)}>
              <div className={isPanel ? "p-4" : "p-6 sm:p-8"}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className={`font-semibold text-neutral-900 ${isPanel ? "text-sm" : "text-xl"}`}>
                      AdPro™ Account
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Individual and multi-PIN packages.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountCategory("adpro");
                      setAdproExpanded(!adproExpanded);
                    }}
                    className="shrink-0 w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                  >
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-400 transition-transform ${adproExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>

                {adproExpanded && (
                  <div className="space-y-3 border-t border-neutral-100 pt-3 mt-2">
                    {ADPRO_PLANS.map((planType) => {
                      const plan = PLAN_DETAILS[planType];
                      return (
                        <div
                          key={planType}
                          className="rounded-lg border border-neutral-200 p-3"
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="min-w-0">
                              <span className="block text-xs font-medium text-neutral-900">
                                {plan.label}
                              </span>
                              <span className="text-[10px] text-neutral-400 block">
                                {plan.description}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-neutral-900 shrink-0">
                              {formatCAD(plan.price)}/mo
                            </span>
                          </div>
                          <PayPalButtons
                            style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay", height: 38 }}
                            createOrder={(_data, actions) =>
                              actions.order.create({
                                intent: "CAPTURE",
                                purchase_units: [
                                  {
                                    description: `${plan.label} Registration`,
                                    amount: {
                                      currency_code: "CAD",
                                      value: registrationTotalFor(
                                        plan.price
                                      ).toFixed(2),
                                    },
                                  },
                                ],
                              })
                            }
                            onApprove={async (_data, actions) => {
                              if (actions.order) {
                                const details = await actions.order.capture();
                                await handlePaypalApprove(planType, {
                                  id: details.id || "",
                                  captureId:
                                    details.purchase_units?.[0]?.payments
                                      ?.captures?.[0]?.id,
                                });
                              }
                            }}
                            onError={() => {
                              setError("Payment failed. Please try again.");
                              setPaypalKey((k) => k + 1);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        </PayPalScriptProvider>
      </div>

      {processing && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-neutral-600 font-medium">
              Creating your MapSite™...
            </p>
          </div>
        </div>
      )}
    </>
  );
}
