"use client";

// ⚠️ DEPRECATED — Use /talispros/register instead.
// This route is AdPro-only with a fixed $49.99 fee and lacks Root/Derivative support.
// Kept for backward compatibility; will be removed in a future release.

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { registerMapsite, type RegisterMapsiteInput } from "./actions";

const ADPRE_TYPES = [
  { value: "single", label: "Single AdPro™ PIN", description: "Individual business placement." },
  { value: "up-to-10", label: "Up To 10 AdPro™ PINs", description: "Ideal for small teams and multi-location operators." },
  { value: "up-to-100", label: "Up To 100 AdPro™ PINs", description: "Suitable for brokerages, agencies, franchises and regional organizations." },
  { value: "unlimited", label: "Unlimited AdPro™ PINs", description: "Enterprise-scale deployment." },
];

function RegisterMapsiteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fastCode, setFastCode] = useState(searchParams.get("fastCode") || "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [accountType, setAccountType] = useState("single");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "payment" | "processing">("form");
  const [mapsiteResult, setMapsiteResult] = useState<{
    fastCode: string;
    slug: string;
    url: string;
  } | null>(null);
  const [paypalKey, setPaypalKey] = useState(0);

  function handleProceedToPayment(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!fastCode.trim()) { setError("FAST Code is required"); return; }
    if (!firstName.trim()) { setError("First name is required"); return; }
    if (!lastName.trim()) { setError("Last name is required"); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Valid email is required"); return; }

    setStep("payment");
    setPaypalKey((k) => k + 1);
  }

  async function handlePaymentSuccess() {
    setStep("processing");

    const input: RegisterMapsiteInput = {
      fastCode: fastCode.trim(),
      accountType,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city.trim(),
      province: province.trim(),
    };

    const result = await registerMapsite(input);

    if (result.success && result.mapsite) {
      setMapsiteResult(result.mapsite);
      router.push(result.redirectUrl || "/talispros/client/dashboard");
    } else {
      setError(result.error || "Registration failed. Please contact support.");
      setStep("payment");
    }
  }

  if (mapsiteResult) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-5 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            Register Your MapSite™
          </h1>
          <p className="text-neutral-500 mt-2">
            Complete registration and payment to activate your MapSite.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {step === "form" && (
          <form onSubmit={handleProceedToPayment} className="space-y-5">
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                FAST Code <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={fastCode}
                onChange={(e) => setFastCode(e.target.value)}
                placeholder="e.g. JOHN-TORONTO"
                className="w-full h-11 px-4 bg-white border border-neutral-200 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
              />
            </div>

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
                Email <span className="text-red-400">*</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Toronto"
                  className="w-full h-11 px-4 bg-white border border-neutral-200 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                  Province / State
                </label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Ontario"
                  className="w-full h-11 px-4 bg-white border border-neutral-200 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                Account Type
              </label>
              <div className="space-y-2">
                {ADPRE_TYPES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAccountType(opt.value)}
                    className={`w-full flex items-start gap-4 px-4 py-3 rounded-xl border text-left transition-all ${
                      accountType === opt.value
                        ? "border-neutral-900 bg-neutral-900/5"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        accountType === opt.value ? "border-neutral-900" : "border-neutral-300"
                      }`}
                    >
                      {accountType === opt.value && (
                        <span className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
                      )}
                    </span>
                    <div>
                      <span className="block text-sm font-medium text-neutral-900">
                        {opt.label}
                      </span>
                      <span className="block text-xs text-neutral-500 mt-0.5">
                        {opt.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full h-12 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wide hover:bg-neutral-800 active:scale-[0.98] transition-all"
              >
                Proceed to Payment
              </button>
            </div>
          </form>
        )}

        {step === "payment" && (
          <div>
            <div className="bg-neutral-50 rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-2">
                MapSite Registration
              </h2>
              <div className="space-y-1 text-sm text-neutral-600">
                <p>FAST Code: <span className="font-medium text-neutral-900">{fastCode}</span></p>
                <p>Name: <span className="font-medium text-neutral-900">{firstName} {lastName}</span></p>
                <p>Email: <span className="font-medium text-neutral-900">{email}</span></p>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <p className="text-2xl font-bold text-neutral-900">$49.99 CAD</p>
                <p className="text-xs text-neutral-500 mt-1">One-time registration fee</p>
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
              <PayPalButtons
                style={{ layout: "vertical", color: "blue", shape: "rect" }}
                createOrder={(data, actions) => {
                  return actions.order.create({
                    intent: "CAPTURE",
                    purchase_units: [{
                      description: "MapSite Registration",
                      amount: {
                        currency_code: "CAD",
                        value: "49.99",
                      },
                    }],
                  });
                }}
                onApprove={async (data, actions) => {
                  if (actions.order) {
                    await actions.order.capture();
                    await handlePaymentSuccess();
                  }
                }}
                onError={() => {
                  setError("Payment failed. Please try again.");
                }}
              />
            </PayPalScriptProvider>

            <button
              type="button"
              onClick={() => setStep("form")}
              className="w-full mt-4 text-sm text-neutral-400 hover:text-neutral-900 transition-colors underline underline-offset-2"
            >
              Back to form
            </button>
          </div>
        )}

        {step === "processing" && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-600">Creating your MapSite...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegisterMapsitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" /></div>}>
      <RegisterMapsiteForm />
    </Suspense>
  );
}
