"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { formatCAD } from "@/utils/currency";
import Link from "next/link";
import FastCodeSidebarCard from "@/components/talispros/FastCodeSidebarCard";
import { Check, ChevronDown } from "lucide-react";
import { processPayment } from "./payment-actions";

const TAX_RATE = 0.14;

type PlanType =
  | "ROOT_ACCOUNT"
  | "DERIVATIVE_ACCOUNT"
  | "ADPRO_SINGLE"
  | "ADPRO_10"
  | "ADPRO_100"
  | "ADPRO_UNLIMITED";

interface PlanDetail {
  label: string;
  price: number;
  monthly?: number;
  bullets?: string[];
  description?: string;
}

const PLAN_DETAILS: Record<PlanType, PlanDetail> = {
  ROOT_ACCOUNT: {
    label: "Root Account™",
    price: 998.50,
    monthly: 98.50,
    description: "Market ownership and full platform access.",
    bullets: [
      "Up to 100 Derivative Accounts",
      "SPLITS enabled",
      "Claim A Market™ eligible",
      "FAST Code generation",
      "Market ownership capabilities",
    ],
  },
  DERIVATIVE_ACCOUNT: {
    label: "Derivative Account™",
    price: 198.50,
    monthly: 19.50,
    description: "Multi-PIN account under a Root Account™.",
    bullets: [
      "Multi-PIN support",
      "Operates under Root Account™",
      "SPLITS enabled",
      "FAST Code generation",
    ],
  },
  ADPRO_SINGLE: {
    label: "Single AdPro™ PIN",
    price: 49.95,
    description: "Individual business placement.",
  },
  ADPRO_10: {
    label: "Up To 10 AdPro™ PINs",
    price: 249.95,
    description: "Small teams and multi-location operators.",
  },
  ADPRO_100: {
    label: "Up To 100 AdPro™ PINs",
    price: 499.95,
    description: "Brokerages, franchises, regional organizations.",
  },
  ADPRO_UNLIMITED: {
    label: "Unlimited AdPro™ PINs",
    price: 999.95,
    description: "Enterprise deployment.",
  },
};

const ADPRO_PLANS: PlanType[] = [
  "ADPRO_SINGLE",
  "ADPRO_10",
  "ADPRO_100",
  "ADPRO_UNLIMITED",
];



function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
      {!required && <span className="text-neutral-300 ml-0.5">(optional)</span>}
    </label>
  );
}

function RegisterSidebar() {
  return (
    <div className="space-y-6">
      {/* CTA Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-[#c92026] text-center">
        <p className="text-sm text-neutral-900 leading-relaxed mb-4">
          Finally, choose an account level in the self check-out
          (select &ldquo;View Details&rdquo; to learn about differences between account types).
        </p>
        <Link
          href="/talispros/build-mapsite"
          className="inline-flex h-10 px-6 bg-neutral-900 text-white rounded-lg text-sm font-medium tracking-wide items-center justify-center hover:bg-neutral-800 active:scale-[0.98] transition-all"
        >
          Enter MapSite™
        </Link>
      </div>

      {/* Partner Access iframe */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: "500px" }}>
        <iframe
          src="/partner-access"
          width="100%"
          height="100%"
          frameBorder="0"
          title="Partner Access"
        />
      </div>

      <FastCodeSidebarCard />
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paypalKey, setPaypalKey] = useState(0);
  const [adproExpanded, setAdproExpanded] = useState(false);
  const [accountCategory, setAccountCategory] = useState<"root" | "derivative" | "adpro">("root");

  const isAdpro = accountCategory === "adpro";

  useEffect(() => {
    const plan = searchParams.get("plan");
    if (plan === "derivative") {
      setAccountCategory("derivative");
    } else if (plan === "adpro") {
      setAccountCategory("adpro");
      setAdproExpanded(true);
    } else if (plan === "root") {
      setAccountCategory("root");
    }
  }, [searchParams]);

  function totalFor(price: number): number {
    return price + price * TAX_RATE;
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
      router.push(result.redirectUrl);
    } else {
      setError(result.error || "Payment processing failed. Please contact support.");
      setProcessing(false);
      setPaypalKey((k) => k + 1);
    }
  }

  return (
    <div className="flex flex-col h-screen lg:h-screen bg-white font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
        <div className="w-full lg:w-[70%] lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-2xl mx-auto px-5 py-8 sm:py-12 lg:py-16">
            <div className="text-center mb-8 sm:mb-10">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-neutral-900">
                Register Your MapSite™
              </h1>
              <p className="text-sm sm:text-base text-neutral-500 mt-2">
                Choose your account type and complete payment to activate.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <PayPalScriptProvider
              key={paypalKey}
              options={{
                clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
                currency: "CAD",
                intent: "capture",
              }}
            >
              <div className="space-y-8">
                {/* Root Account™ */}
                <div
                  className={`rounded-2xl border-2 transition-all cursor-pointer ${
                    accountCategory === "root" && !isAdpro
                      ? "border-neutral-900 shadow-md"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                  onClick={() => setAccountCategory("root")}
                >
                  <div className="p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-neutral-900">Root Account™</h2>
                        <p className="text-sm text-neutral-500 mt-1">{PLAN_DETAILS.ROOT_ACCOUNT.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-neutral-900">{formatCAD(PLAN_DETAILS.ROOT_ACCOUNT.price)}</div>
                        <div className="text-xs text-neutral-400">setup</div>
                        <div className="text-lg font-bold text-neutral-900 mt-1">{formatCAD(PLAN_DETAILS.ROOT_ACCOUNT.monthly!)}</div>
                        <div className="text-xs text-neutral-400">/month</div>
                      </div>
                    </div>
                    <ul className="space-y-1.5 mb-5">
                      {PLAN_DETAILS.ROOT_ACCOUNT.bullets!.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-sm text-neutral-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 flex-shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <PayPalButtons
                      style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          intent: "CAPTURE",
                          purchase_units: [{
                            description: "Root Account™ Registration",
                            amount: {
                              currency_code: "CAD",
                              value: totalFor(PLAN_DETAILS.ROOT_ACCOUNT.price).toFixed(2),
                            },
                          }],
                        });
                      }}
                      onApprove={async (data, actions) => {
                        if (actions.order) {
                          const details = await actions.order.capture();
                          await handlePaypalApprove("ROOT_ACCOUNT", {
                            id: details.id || "",
                            captureId: details.purchase_units?.[0]?.payments?.captures?.[0]?.id,
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

                {/* Derivative Account™ */}
                <div
                  className={`rounded-2xl border-2 transition-all cursor-pointer ${
                    accountCategory === "derivative"
                      ? "border-neutral-900 shadow-md"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                  onClick={() => setAccountCategory("derivative")}
                >
                  <div className="p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-neutral-900">Derivative Account™</h2>
                        <p className="text-sm text-neutral-500 mt-1">{PLAN_DETAILS.DERIVATIVE_ACCOUNT.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-neutral-900">{formatCAD(PLAN_DETAILS.DERIVATIVE_ACCOUNT.price)}</div>
                        <div className="text-xs text-neutral-400">setup</div>
                        <div className="text-lg font-bold text-neutral-900 mt-1">{formatCAD(PLAN_DETAILS.DERIVATIVE_ACCOUNT.monthly!)}</div>
                        <div className="text-xs text-neutral-400">/month</div>
                      </div>
                    </div>
                    <ul className="space-y-1.5 mb-5">
                      {PLAN_DETAILS.DERIVATIVE_ACCOUNT.bullets!.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-sm text-neutral-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 flex-shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <PayPalButtons
                      style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          intent: "CAPTURE",
                          purchase_units: [{
                            description: "Derivative Account™ Registration",
                            amount: {
                              currency_code: "CAD",
                              value: totalFor(PLAN_DETAILS.DERIVATIVE_ACCOUNT.price).toFixed(2),
                            },
                          }],
                        });
                      }}
                      onApprove={async (data, actions) => {
                        if (actions.order) {
                          const details = await actions.order.capture();
                          await handlePaypalApprove("DERIVATIVE_ACCOUNT", {
                            id: details.id || "",
                            captureId: details.purchase_units?.[0]?.payments?.captures?.[0]?.id,
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

                {/* AdPro™ Account Section */}
                <div
                  className={`rounded-2xl border-2 transition-all ${
                    isAdpro
                      ? "border-neutral-900 shadow-md"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <div className="p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-neutral-900">AdPro™ Account</h2>
                        <p className="text-sm text-neutral-500 mt-1">Individual and multi-PIN packages. No SPLITS.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setAccountCategory("adpro"); setAdproExpanded(!adproExpanded); }}
                        className="flex-shrink-0 w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors"
                      >
                        <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${adproExpanded ? "rotate-180" : ""}`} />
                      </button>
                    </div>

                    <p className="text-xs text-neutral-400 mb-4">
                      {adproExpanded ? "Choose a package and pay below" : "Click to expand package options"}
                    </p>

                    {adproExpanded && (
                      <div className="space-y-3 border-t border-neutral-100 pt-4">
                        {ADPRO_PLANS.map((planType) => {
                          const plan = PLAN_DETAILS[planType];
                          return (
                            <div
                              key={planType}
                              className="rounded-xl border border-neutral-200 p-4"
                            >
                              <div className="flex items-center justify-between gap-4 mb-3">
                                <div className="min-w-0">
                                  <span className="block text-sm font-medium text-neutral-900">{plan.label}</span>
                                  <span className="text-xs text-neutral-400 mt-0.5 block">{plan.description}</span>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                  <span className="text-sm font-bold text-neutral-900">{formatCAD(plan.price)}</span>
                                  <span className="text-xs text-neutral-400 ml-1">/mo</span>
                                </div>
                              </div>
                              <PayPalButtons
                                style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                                createOrder={(data, actions) => {
                                  return actions.order.create({
                                    intent: "CAPTURE",
                                    purchase_units: [{
                                      description: `${plan.label} Registration`,
                                      amount: {
                                        currency_code: "CAD",
                                        value: totalFor(plan.price).toFixed(2),
                                      },
                                    }],
                                  });
                                }}
                                onApprove={async (data, actions) => {
                                  if (actions.order) {
                                    const details = await actions.order.capture();
                                    await handlePaypalApprove(planType, {
                                      id: details.id || "",
                                      captureId: details.purchase_units?.[0]?.payments?.captures?.[0]?.id,
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

                {/* Personal Info */}
                <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-5">
                    Personal Info
                  </h2>

                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                          First Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="John"
                          className="w-full h-11 px-4 bg-white border border-neutral-200 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                          Last Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Smith"
                          className="w-full h-11 px-4 bg-white border border-neutral-200 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full h-11 px-4 bg-white border border-neutral-200 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full h-11 px-4 bg-white border border-neutral-200 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Recommended Service Floors Panel */}
                <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-3">
                    Recommended Service Floors
                  </h2>
                  <div className="text-sm text-neutral-600 space-y-3 leading-relaxed">
                    <p>
                      To maintain marketplace quality and member value,
                      TalisPros™ recommends minimum service fees and
                      minimum participation terms for inclusion.
                    </p>
                    <p>
                      These recommendations support future
                      fractional ownership opportunities, development
                      projects, referral ecosystems, and marketplace integrity.
                    </p>
                  </div>
                </div>
              </div>
            </PayPalScriptProvider>
          </div>
        </div>

        <div className="w-full lg:w-[30%] bg-[#e2e5ea] lg:border-l border-[#e5e5e5] p-8 lg:sticky lg:top-0 lg:self-start lg:max-h-screen lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <RegisterSidebar />
        </div>
      </div>

      {processing && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-600 font-medium">Creating your MapSite™...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TalisprosRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
