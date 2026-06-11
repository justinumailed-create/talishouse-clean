"use client";

import { useState, FormEvent } from "react";
import { ArrowRight, Copy, Check, ExternalLink } from "lucide-react";
import Image from "next/image";
import { registerFastCode, type FormFields, type ActionResult } from "./actions";

type Phase = "form" | "success" | "error";

const PROVINCES = [
  "Ontario",
  "British Columbia",
  "Alberta",
  "Quebec",
  "Nova Scotia",
  "Manitoba",
  "Saskatchewan",
  "New Brunswick",
  "Prince Edward Island",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nunavut",
  "Yukon",
];

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California",
  "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri",
  "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

export default function FastCodeGeneratorPage() {
  const [phase, setPhase] = useState<Phase>("form");
  const [fastCode, setFastCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [fields, setFields] = useState<FormFields>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    province: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormFields, string>>>({});

  function validate(): boolean {
    const errs: Partial<Record<keyof FormFields, string>> = {};
    if (!fields.firstName.trim()) errs.firstName = "Required";
    if (!fields.lastName.trim()) errs.lastName = "Required";
    if (!fields.email.trim()) errs.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) errs.email = "Invalid email";
    if (!fields.phone.trim()) errs.phone = "Required";
    if (!fields.address.trim()) errs.address = "Required";
    if (!fields.province.trim()) errs.province = "Required";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    if (fields.province === "admin-apply") {
      window.location.href = "mailto:welcome@talispros.com?subject=National Super Admin Application";
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const result: ActionResult = await registerFastCode(fields);

      if (result.success && result.fastCode) {
        setFastCode(result.fastCode);
        setPhase("success");
        setTimeout(() => {
          const registerUrl = `https://www.talispros.com/bo/register/?code=${result.fastCode}`;
          console.log("Inside iframe:", window.top !== window.self);
          console.log("Redirecting to:", registerUrl);
          if (window.top && window.top !== window.self) {
            window.top.location.href = registerUrl;
          } else {
            window.location.href = registerUrl;
          }
        }, 1500);
      } else {
        setErrorMsg(result.error || "Something went wrong.");
        setPhase("error");
      }
    } catch (err) {
      console.error("[fast-code/client] Server action call failed:", err);
      setErrorMsg(
        `Client error: ${err instanceof Error ? err.message : "Unknown"}`
      );
      setPhase("error");
    }

    setSubmitting(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(fastCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setPhase("form");
    setFastCode("");
    setErrorMsg("");
    setCopied(false);
    setFields({ firstName: "", lastName: "", email: "", phone: "", address: "", province: "" });
    setFieldErrors({});
  }

  function setField(key: keyof FormFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    }
  }

  return (
    <div className="font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <div className="mx-auto max-w-lg w-full px-5 py-4">
        <div className="text-center mb-4">
          <Image
            src="/logo.png"
            alt="TalisPros"
            width={150}
            height={40}
            className="h-10 md:h-[52px] w-auto object-contain mx-auto mb-3"
            priority
          />
          <h1 className="text-xl md:text-2xl font-light tracking-tight">Generate FAST Code</h1>
          <p className="text-sm text-neutral-500 font-light mt-1 max-w-sm mx-auto">
            Enter your details to be issued a unique Gateway.
          </p>
        </div>

        {phase === "form" && (
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <FieldBox
                label="First Name"
                value={fields.firstName}
                onChange={(v) => setField("firstName", v)}
                error={fieldErrors.firstName}
                placeholder="John"
                autoComplete="given-name"
              />
              <FieldBox
                label="Last Name"
                value={fields.lastName}
                onChange={(v) => setField("lastName", v)}
                error={fieldErrors.lastName}
                placeholder="Smith"
                autoComplete="family-name"
              />
            </div>

            <FieldBox
              label="Email"
              type="email"
              value={fields.email}
              onChange={(v) => setField("email", v)}
              error={fieldErrors.email}
              placeholder="john@example.com"
              autoComplete="email"
            />

            <FieldBox
              label="Cell Phone"
              type="tel"
              value={fields.phone}
              onChange={(v) => setField("phone", v)}
              error={fieldErrors.phone}
              placeholder="(555) 123-4567"
              autoComplete="tel"
            />

            <FieldBox
              label="Street Address"
              value={fields.address}
              onChange={(v) => setField("address", v)}
              error={fieldErrors.address}
              placeholder="123 Main St"
              autoComplete="street-address"
            />

            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1.5 block">State / Province</label>
              <select
                value={fields.province}
                onChange={(e) => setField("province", e.target.value)}
                className={`w-full h-12 px-4 bg-white border rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all ${
                  fieldErrors.province ? "border-red-300" : "border-neutral-200"
                }`}
              >
                <option value="">Select State / Province</option>
                <optgroup label="Canada">
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </optgroup>
                <optgroup label="United States">
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </optgroup>
                <option disabled>──────────</option>
                <option value="admin-apply">National Super Admin. wanted, apply here</option>
              </select>
              {fieldErrors.province && <p className="text-xs text-red-500 mt-1">{fieldErrors.province}</p>}
            </div>

            {errorMsg && (
              <p className="text-xs font-medium text-red-500 text-center">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full h-12 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Proceed
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {phase === "success" && (
          <div className="text-center space-y-4">
            <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-6 md:p-8 shadow-sm">
              <p className="text-xs font-medium text-neutral-400 tracking-widest uppercase mb-3">
                Your Fast Code
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">
                  {fastCode}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex-shrink-0 w-9 h-9 rounded-lg border border-neutral-200 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                  title="Copy Fast Code"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-neutral-400" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-sm text-neutral-500 font-light">
              Your MapSite is ready. Redirecting to registration...
            </p>

            <button
              onClick={() => {
                const registerUrl = `https://www.talispros.com/bo/register/?code=${fastCode}`;
                console.log("Inside iframe:", window.top !== window.self);
                console.log("Redirecting to:", registerUrl);
                if (window.top && window.top !== window.self) {
                  window.top.location.href = registerUrl;
                } else {
                  window.location.href = registerUrl;
                }
              }}
              className="w-full h-12 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-sm"
            >
              Finish Registration
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="text-xs font-medium text-neutral-400 hover:text-neutral-900 transition-colors underline underline-offset-2"
            >
              Generate another Fast Code
            </button>
          </div>
        )}

        {phase === "error" && (
          <div className="text-center space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
              <p className="text-sm font-medium text-red-700">{errorMsg}</p>
            </div>
            <button
              onClick={() => setPhase("form")}
              className="w-full h-12 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-sm"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldBox({
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-neutral-500 mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full h-12 px-4 bg-white border rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all ${
          error ? "border-red-300" : "border-neutral-200"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
