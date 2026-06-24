"use client";

// ⚠️ DEPRECATED — Use /talispros/register instead.
// This route is AdPro-only and lacks Root/Derivative account support.
// Kept for backward compatibility; will be removed in a future release.

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { saveRegistration, type RegistrationInput } from "./actions";
import { formatCAD } from "@/utils/currency";

const TAX_RATE = 0.14;

const ADPRE_PACKAGES = [
  {
    value: "single",
    label: "Single AdPro™ PIN",
    description: "Individual business placement.",
    price: 49.95,
  },
  {
    value: "up-to-10",
    label: "Up To 10 AdPro™ PINs",
    description: "Ideal for small teams and multi-location operators.",
    price: 249.95,
  },
  {
    value: "up-to-100",
    label: "Up To 100 AdPro™ PINs",
    description: "Suitable for brokerages, agencies, franchises and regional organizations.",
    price: 499.95,
  },
  {
    value: "unlimited",
    label: "Unlimited AdPro™ PINs",
    description: "Enterprise-scale deployment.",
    price: 999.95,
  },
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPackage, setSelectedPackage] = useState("single");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [useDefaultFastCode, setUseDefaultFastCode] = useState(false);
  const [overrideFastCode, setOverrideFastCode] = useState(
    searchParams.get("fastCode") || ""
  );
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "processing">("form");

  const pkg = ADPRE_PACKAGES.find((p) => p.value === selectedPackage)!;
  const subtotal = pkg.price;
  const taxes = subtotal * TAX_RATE;
  const totalDue = subtotal + taxes;

  const fastCode = useDefaultFastCode
    ? "DEFAULT"
    : overrideFastCode.trim() || "";

  function validate(): string | null {
    if (!firstName.trim()) return "First name is required";
    if (!lastName.trim()) return "Last name is required";
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "Valid email is required";
    if (!selectedPackage) return "Select a package";
    if (!useDefaultFastCode && overrideFastCode.trim()) {
      if (overrideFastCode.trim().length < 3)
        return "FAST Code must be at least 3 characters";
    }
    return null;
  }

  async function handlePayPalApprove(
    orderId: string,
    captureId: string
  ) {
    setStep("processing");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setStep("form");
      return;
    }

    const input: RegistrationInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      accountType: selectedPackage,
      fastCode,
      amountPaid: totalDue,
      monthlySubscription: pkg.price,
      paypalOrderId: orderId,
      paypalCaptureId: captureId,
    };

    const result = await saveRegistration(input);

    if (result.success && result.mapsite) {
      router.push(result.mapsite.url);
    } else {
      setError(result.error || "Registration failed. Please contact support.");
      setStep("form");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
            Register Your MapSite™
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 mt-2">
            Choose your AdPro™ package and complete payment to activate.
          </p>
        </div>

        {error && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT — Package Selection (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900 mb-5">
                AdPro™ Packages
              </h2>

              <div className="space-y-3 mb-6">
                {ADPRE_PACKAGES.map((pkg) => {
                  const isActive = selectedPackage === pkg.value;
                  return (
                    <button
                      key={pkg.value}
                      type="button"
                      onClick={() => setSelectedPackage(pkg.value)}
                      className={`w-full flex items-start gap-4 p-4 sm:p-5 rounded-xl border text-left transition-all ${
                        isActive
                          ? "border-neutral-900 bg-neutral-900/5"
                          : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                          isActive ? "border-neutral-900" : "border-neutral-300"
                        }`}
                      >
                        {isActive && (
                          <span className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span
                          className={`block text-sm font-semibold ${
                            isActive ? "text-neutral-900" : "text-neutral-700"
                          }`}
                        >
                          {pkg.label}
                        </span>
                        <span className="text-xs text-neutral-500 mt-0.5 block">
                          {pkg.description}
                        </span>
                        <div className="mt-2">
                          <span className="text-lg font-bold text-neutral-900">
                            CAD {formatCAD(pkg.price)}
                          </span>
                          <span className="text-sm text-neutral-500 ml-1">
                            /month
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-neutral-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Monthly Plan</span>
                  <span className="text-neutral-900 font-medium">
                    CAD {formatCAD(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Taxes (14%)</span>
                  <span className="text-neutral-900 font-medium">
                    {formatCAD(taxes)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold border-t border-neutral-200 pt-2">
                  <span className="text-neutral-900">Amount Due Now</span>
                  <span className="text-neutral-900">
                    {formatCAD(totalDue)}
                  </span>
                </div>
              </div>

              {step === "form" && (
                <div className="mt-6">
                  <PayPalScriptProvider
                    options={{
                      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
                      currency: "CAD",
                      intent: "capture",
                    }}
                  >
                    <PayPalButtons
                      style={{ layout: "vertical", color: "blue", shape: "rect" }}
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          intent: "CAPTURE",
                          purchase_units: [{
                            description: `${pkg.label} — ${pkg.description}`,
                            amount: {
                              currency_code: "CAD",
                              value: totalDue.toFixed(2),
                            },
                          }],
                        });
                      }}
                      onApprove={async (data, actions) => {
                        if (actions.order) {
                          const details = await actions.order.capture();
                          await handlePayPalApprove(
                            details.id || "",
                            details.purchase_units?.[0]?.payments?.captures?.[0]?.id || ""
                          );
                        }
                      }}
                      onError={() => {
                        setError("Payment failed. Please try again.");
                      }}
                    />
                  </PayPalScriptProvider>
                </div>
              )}
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

          {/* RIGHT — Additional Info (2/5) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900 mb-5">
                Your Information
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

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useDefaultFastCode}
                    onChange={(e) => {
                      setUseDefaultFastCode(e.target.checked);
                      if (e.target.checked) setOverrideFastCode("");
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <span className="text-sm text-neutral-600 leading-relaxed">
                    Register me via default FAST Code (optional)
                  </span>
                </label>

                <div>
                  <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                    Override FAST Code with chosen FAST Code
                  </label>
                  <input
                    type="text"
                    value={overrideFastCode}
                    onChange={(e) => {
                      setOverrideFastCode(e.target.value);
                      if (e.target.value) setUseDefaultFastCode(false);
                    }}
                    placeholder="Enter your FAST Code"
                    disabled={useDefaultFastCode}
                    className="w-full h-11 px-4 bg-white border border-neutral-200 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20 disabled:opacity-50 disabled:bg-neutral-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {step === "processing" && (
          <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-neutral-600 font-medium">Processing your registration...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
