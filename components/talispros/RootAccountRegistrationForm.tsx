"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { ChevronDown } from "lucide-react";
import { formatCAD } from "@/utils/currency";
import { processPayment } from "@/app/talispros/register/payment-actions";
import {
  routeRegistrationByFastCode,
  validateSponsorFastCode,
} from "@/app/talispros/register/fast-code-actions";
import { setFastCode } from "@/lib/fast-code";
import type { OfferedSubscriptionTier } from "@/lib/mapsite-subscription";
import {
  ROOT_ACCOUNT_DISPLAY_BULLETS,
  type RegistrationAccountCategory,
  type RegistrationMarket,
} from "@/lib/registration-market";
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
  market?: RegistrationMarket;
  initialAccount?: RegistrationAccountCategory;
  initialSponsor?: string;
}

const DERIVATIVE_SPONSOR_COPY =
  "Join an existing Root Account™. Sponsor FAST Code required.";
const ADPRO_SPONSOR_COPY =
  "Join an existing marketing network. Sponsor FAST Code required.";
const ADPRO_ACCOUNT_DESCRIPTION =
  "Place your business on the map with individual or multi-PIN AdPro™ packages under an established marketing network.";

export default function RootAccountRegistrationForm({
  variant = "page",
  allowedTier,
  parentFastCode,
  market,
  initialAccount = "root",
  initialSponsor,
}: RootAccountRegistrationFormProps) {
  const router = useRouter();
  const isPanel = variant === "panel";
  const unifiedMode = Boolean(market) && !isPanel;

  const showRoot = unifiedMode || !allowedTier || allowedTier === "root";
  const showDerivative =
    unifiedMode || !allowedTier || allowedTier === "derivative";
  const showAdpro =
    unifiedMode ||
    !allowedTier ||
    allowedTier === "adpro" ||
    (allowedTier === "derivative" && !!parentFastCode);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paypalKey, setPaypalKey] = useState(0);
  const [adproExpanded, setAdproExpanded] = useState(
    unifiedMode ? true : allowedTier === "adpro"
  );
  const [accountCategory, setAccountCategory] = useState<
    RegistrationAccountCategory
  >(unifiedMode ? initialAccount : (allowedTier ?? "root"));
  const initialSponsorCode =
    initialSponsor?.toUpperCase() ?? parentFastCode?.toUpperCase() ?? "";
  const [derivativeSponsorFastCode, setDerivativeSponsorFastCode] = useState(
    initialAccount === "derivative" || initialSponsorCode
      ? initialSponsorCode
      : ""
  );
  const [adproSponsorFastCode, setAdproSponsorFastCode] = useState(
    initialAccount === "adpro" || initialSponsorCode ? initialSponsorCode : ""
  );
  const [sponsorFastCode, setSponsorFastCode] = useState(initialSponsorCode);
  const [routingFastCode, setRoutingFastCode] = useState(false);
  const [validatingSponsor, setValidatingSponsor] = useState(false);
  const [sponsorValidated, setSponsorValidated] = useState(false);
  const [validatedSponsorCode, setValidatedSponsorCode] = useState("");
  const [showDerivativeAfterValidate, setShowDerivativeAfterValidate] =
    useState(true);
  const [showAdproAfterValidate, setShowAdproAfterValidate] = useState(true);

  const isAdpro = accountCategory === "adpro";
  const showFastCodeRouting =
    !unifiedMode &&
    (allowedTier === "root" || allowedTier === "derivative") &&
    !parentFastCode;

  function sponsorCategoryForPlan(
    planType: PlanType
  ): RegistrationAccountCategory | null {
    if (planType === "DERIVATIVE_ACCOUNT") return "derivative";
    if (planType.startsWith("ADPRO_")) return "adpro";
    return null;
  }

  function sponsorCodeForCategory(
    category: RegistrationAccountCategory
  ): string {
    if (unifiedMode && sponsorValidated) return validatedSponsorCode;
    if (category === "derivative") return derivativeSponsorFastCode;
    if (category === "adpro") return adproSponsorFastCode;
    return sponsorFastCode;
  }

  function setSponsorCodeForCategory(
    category: RegistrationAccountCategory,
    code: string
  ) {
    if (category === "derivative") {
      setDerivativeSponsorFastCode(code);
      return;
    }
    if (category === "adpro") {
      setAdproSponsorFastCode(code);
      return;
    }
    setSponsorFastCode(code);
  }

  async function handleValidateUnifiedSponsor() {
    const code = derivativeSponsorFastCode.trim();
    if (!code) {
      setError("Sponsor FAST Code is required.");
      return;
    }

    setValidatingSponsor(true);
    setError("");

    const derivativeResult = await validateSponsorFastCode(code, "derivative");
    if (derivativeResult.ok) {
      setValidatedSponsorCode(derivativeResult.code);
      setDerivativeSponsorFastCode(derivativeResult.code);
      setAdproSponsorFastCode(derivativeResult.code);
      setShowDerivativeAfterValidate(true);
      setShowAdproAfterValidate(true);
      setSponsorValidated(true);
      setPaypalKey((k) => k + 1);
      setValidatingSponsor(false);
      return;
    }

    const adproResult = await validateSponsorFastCode(code, "adpro");
    if (adproResult.ok) {
      setValidatedSponsorCode(adproResult.code);
      setDerivativeSponsorFastCode(adproResult.code);
      setAdproSponsorFastCode(adproResult.code);
      setShowDerivativeAfterValidate(false);
      setShowAdproAfterValidate(true);
      setSponsorValidated(true);
      setPaypalKey((k) => k + 1);
      setValidatingSponsor(false);
      return;
    }

    setError(derivativeResult.error);
    setValidatingSponsor(false);
  }

  function resetSponsorValidation() {
    setSponsorValidated(false);
    setValidatedSponsorCode("");
    setShowDerivativeAfterValidate(true);
    setShowAdproAfterValidate(true);
    setPaypalKey((k) => k + 1);
  }

  function handleDerivativeSponsorChange(code: string) {
    setDerivativeSponsorFastCode(code);
    if (sponsorValidated) {
      resetSponsorValidation();
    }
  }

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

  function validatePersonalInfo(): string | null {
    if (!firstName.trim()) return "First name is required";
    if (!lastName.trim()) return "Last name is required";
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "Valid email is required";
    return null;
  }

  async function validateSponsorIfNeeded(
    planType: PlanType
  ): Promise<string | null> {
    const category = sponsorCategoryForPlan(planType);
    if (!category) return null;

    if (unifiedMode && !sponsorValidated) {
      return "Validate your Sponsor FAST Code before continuing.";
    }

    if (unifiedMode && sponsorValidated) {
      return null;
    }

    const code = sponsorCodeForCategory(category).trim();
    if (!code) return "Sponsor FAST Code is required";

    setValidatingSponsor(true);
    const result = await validateSponsorFastCode(code, category);
    setValidatingSponsor(false);

    if (!result.ok) return result.error;
    if (result.code !== code.toUpperCase()) {
      setSponsorCodeForCategory(category, result.code);
    }
    return null;
  }

  async function validateBeforePayment(planType: PlanType): Promise<boolean> {
    const personalError = validatePersonalInfo();
    if (personalError) {
      setError(personalError);
      return false;
    }

    const sponsorError = await validateSponsorIfNeeded(planType);
    if (sponsorError) {
      setError(sponsorError);
      return false;
    }

    setError("");
    return true;
  }

  async function handlePaypalApprove(
    planType: PlanType,
    details: { id: string; captureId?: string }
  ) {
    const ok = await validateBeforePayment(planType);
    if (!ok) return;

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

  function renderSponsorValidatorField() {
    return (
      <div className="mb-4">
        <label className="text-xs font-medium text-neutral-500 mb-1 block">
          Sponsor FAST Code <span className="text-red-400">*</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={derivativeSponsorFastCode}
            onChange={(e) =>
              handleDerivativeSponsorChange(e.target.value.toUpperCase())
            }
            placeholder="e.g. rmd1"
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleValidateUnifiedSponsor}
            disabled={validatingSponsor}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-neutral-900 px-6 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
          >
            {validatingSponsor ? "Validating…" : "Validate"}
          </button>
        </div>
      </div>
    );
  }

  function renderValidatedSponsorBadge() {
    return (
      <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Sponsor FAST Code confirmed:{" "}
        <span className="font-mono font-semibold">{validatedSponsorCode}</span>
        <button
          type="button"
          onClick={resetSponsorValidation}
          className="ml-3 text-xs font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
        >
          Change
        </button>
      </div>
    );
  }

  function renderSetupFeeBlock(price: number, monthly?: number) {
    return (
      <div className="text-right shrink-0">
        <div className="font-bold text-neutral-900 text-lg">{formatCAD(price)}</div>
        <div className="text-[10px] text-neutral-400">setup</div>
        {monthly != null && (
          <div className="text-[10px] text-neutral-400 mt-0.5">
            {formatCAD(monthly)}/month
          </div>
        )}
      </div>
    );
  }

  function renderPlanBullets(bullets: string[]) {
    return (
      <ul className="space-y-1.5 mb-4">
        {bullets.map((b) => (
          <li
            key={b}
            className="flex items-center gap-2 text-sm text-neutral-600"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
            {b}
          </li>
        ))}
      </ul>
    );
  }

  function renderPayPalButtons(
    planType: PlanType,
    description: string,
    price: number,
    height: number
  ) {
    return (
      <PayPalButtons
        style={{
          layout: "vertical",
          color: "blue",
          shape: "rect",
          label: "pay",
          height,
        }}
        createOrder={async (_data, actions) => {
          const ok = await validateBeforePayment(planType);
          if (!ok) {
            throw new Error("Validation failed");
          }
          return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [
              {
                description,
                amount: {
                  currency_code: "CAD",
                  value: registrationTotalFor(price).toFixed(2),
                },
              },
            ],
          });
        }}
        onApprove={async (_data, actions) => {
          if (actions.order) {
            const details = await actions.order.capture();
            await handlePaypalApprove(planType, {
              id: details.id || "",
              captureId:
                details.purchase_units?.[0]?.payments?.captures?.[0]?.id,
            });
          }
        }}
        onError={() => {
          setError("Payment failed. Please try again.");
          setPaypalKey((k) => k + 1);
        }}
      />
    );
  }

  function renderUnifiedStackedPaymentSections() {
    return (
      <div className="space-y-6">
        {!sponsorValidated && showRoot && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-neutral-900 text-lg">
                  Root Account™
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Create a brand-new market. No FAST Code required.
                </p>
              </div>
              {renderSetupFeeBlock(
                PLAN_DETAILS.ROOT_ACCOUNT.price,
                PLAN_DETAILS.ROOT_ACCOUNT.monthly
              )}
            </div>
            {renderPlanBullets([...ROOT_ACCOUNT_DISPLAY_BULLETS])}
            {renderPayPalButtons(
              "ROOT_ACCOUNT",
              "Root Account™ Registration",
              PLAN_DETAILS.ROOT_ACCOUNT.price,
              45
            )}
          </div>
        )}

        {showDerivative && (!sponsorValidated || showDerivativeAfterValidate) && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-neutral-900 text-lg">
                  Derivative Account™
                </h3>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  {DERIVATIVE_SPONSOR_COPY}
                </p>
                <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                  {PLAN_DETAILS.DERIVATIVE_ACCOUNT.description}
                </p>
              </div>
              {renderSetupFeeBlock(
                PLAN_DETAILS.DERIVATIVE_ACCOUNT.price,
                PLAN_DETAILS.DERIVATIVE_ACCOUNT.monthly
              )}
            </div>
            {!sponsorValidated &&
              PLAN_DETAILS.DERIVATIVE_ACCOUNT.bullets &&
              renderPlanBullets(PLAN_DETAILS.DERIVATIVE_ACCOUNT.bullets)}
            {!sponsorValidated ? (
              renderSponsorValidatorField()
            ) : (
              <>
                {showDerivativeAfterValidate && (
                  <>
                    {renderValidatedSponsorBadge()}
                    {PLAN_DETAILS.DERIVATIVE_ACCOUNT.bullets &&
                      renderPlanBullets(PLAN_DETAILS.DERIVATIVE_ACCOUNT.bullets)}
                    {renderPayPalButtons(
                      "DERIVATIVE_ACCOUNT",
                      "Derivative Account™ Registration",
                      PLAN_DETAILS.DERIVATIVE_ACCOUNT.price,
                      45
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {showAdpro && (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-neutral-900 text-lg">
                  AdPro™ Account
                </h3>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  {ADPRO_SPONSOR_COPY}
                </p>
                <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                  {ADPRO_ACCOUNT_DESCRIPTION}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-neutral-900 text-sm">
                  from {formatCAD(PLAN_DETAILS.ADPRO_SINGLE.price)}/mo
                </div>
              </div>
            </div>
            {!sponsorValidated ? (
              <p className="text-xs text-neutral-400 leading-relaxed">
                Validate your Sponsor FAST Code in the Derivative Account™
                section above to unlock AdPro™ subscription options.
              </p>
            ) : showAdproAfterValidate ? (
              <>
                <button
                  type="button"
                  onClick={() => setAdproExpanded(!adproExpanded)}
                  className="mb-3 flex w-full items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  <span>Choose an AdPro™ package</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 transition-transform ${adproExpanded ? "rotate-180" : ""}`}
                  />
                </button>
                {adproExpanded && (
                  <div className="space-y-3 border-t border-neutral-100 pt-3">
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
                          {renderPayPalButtons(
                            planType,
                            `${plan.label} Registration`,
                            plan.price,
                            38
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    );
  }

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
        {!unifiedMode && parentFastCode && (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            Registering under sponsor FAST Code{" "}
            <span className="font-mono font-semibold text-neutral-900">
              {parentFastCode.toUpperCase()}
            </span>
            .
          </div>
        )}

        {showFastCodeRouting && (
          <div
            className={`bg-white rounded-xl border border-neutral-200 ${isPanel ? "p-4" : "p-6 sm:p-8 shadow-sm"}`}
          >
            <h3
              className={`font-semibold text-neutral-900 ${isPanel ? "text-sm mb-2" : "text-lg mb-2"}`}
            >
              FAST Code™
            </h3>
            <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
              {allowedTier === "root"
                ? "Enter your sponsor's Root Account™ FAST Code to register as a Derivative Account™ instead."
                : "Enter your sponsor's Root Account™ or Derivative Account™ FAST Code to register as an AdPro™ account instead."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={sponsorFastCode}
                onChange={(e) =>
                  setSponsorFastCode(e.target.value.toUpperCase())
                }
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

        <div
          className={`bg-white rounded-xl border border-neutral-200 ${isPanel ? "p-4" : "p-6 sm:p-8 shadow-sm"}`}
        >
          <h3
            className={`font-semibold text-neutral-900 ${isPanel ? "text-sm mb-3" : "text-lg mb-5"}`}
          >
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        </div>

        <PayPalScriptProvider
          key={paypalKey}
          options={{
            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
            currency: "CAD",
            intent: "capture",
          }}
        >
          {unifiedMode ? (
            renderUnifiedStackedPaymentSections()
          ) : (
            <div className={isPanel ? "space-y-3" : "space-y-6"}>
              {showRoot && (
                <div
                  className={cardClass(accountCategory === "root" && !isAdpro)}
                  onClick={() => setAccountCategory("root")}
                >
                  <div className={isPanel ? "p-4" : "p-6 sm:p-8"}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3
                          className={`font-semibold text-neutral-900 ${isPanel ? "text-sm" : "text-xl"}`}
                        >
                          Root Account™
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1">
                          {PLAN_DETAILS.ROOT_ACCOUNT.description}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className={`font-bold text-neutral-900 ${isPanel ? "text-sm" : "text-lg"}`}
                        >
                          {formatCAD(PLAN_DETAILS.ROOT_ACCOUNT.price)}
                        </div>
                        <div className="text-[10px] text-neutral-400">setup</div>
                      </div>
                    </div>
                    {!isPanel && (
                      <ul className="space-y-1.5 mb-4">
                        {PLAN_DETAILS.ROOT_ACCOUNT.bullets!.map((b) => (
                          <li
                            key={b}
                            className="flex items-center gap-2 text-sm text-neutral-600"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                    {renderPayPalButtons(
                      "ROOT_ACCOUNT",
                      "Root Account™ Registration",
                      PLAN_DETAILS.ROOT_ACCOUNT.price,
                      isPanel ? 40 : 45
                    )}
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
                        <h3
                          className={`font-semibold text-neutral-900 ${isPanel ? "text-sm" : "text-xl"}`}
                        >
                          Derivative Account™
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1">
                          {PLAN_DETAILS.DERIVATIVE_ACCOUNT.description}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className={`font-bold text-neutral-900 ${isPanel ? "text-sm" : "text-lg"}`}
                        >
                          {formatCAD(PLAN_DETAILS.DERIVATIVE_ACCOUNT.price)}
                        </div>
                        <div className="text-[10px] text-neutral-400">setup</div>
                      </div>
                    </div>
                    {renderPayPalButtons(
                      "DERIVATIVE_ACCOUNT",
                      "Derivative Account™ Registration",
                      PLAN_DETAILS.DERIVATIVE_ACCOUNT.price,
                      isPanel ? 40 : 45
                    )}
                  </div>
                </div>
              )}

              {showAdpro && (
                <div className={cardClass(isAdpro)}>
                  <div className={isPanel ? "p-4" : "p-6 sm:p-8"}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3
                          className={`font-semibold text-neutral-900 ${isPanel ? "text-sm" : "text-xl"}`}
                        >
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
                              {renderPayPalButtons(
                                planType,
                                `${plan.label} Registration`,
                                plan.price,
                                38
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
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
