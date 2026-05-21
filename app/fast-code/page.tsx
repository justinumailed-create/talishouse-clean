"use client";

import { useState, FormEvent } from "react";
import { ArrowRight, Copy, Check, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { registerFastCode, type FormFields, type ActionResult } from "./actions";

type Phase = "form" | "success" | "error";

const MAPSITE_DOMAIN = "https://talispros.com";

export default function FastCodeGeneratorPage() {
  const [phase, setPhase] = useState<Phase>("form");
  const [fastCode, setFastCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const [fields, setFields] = useState<FormFields>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
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
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrorMsg("");

    try {
      const result: ActionResult = await registerFastCode(fields);

      if (result.success && result.fastCode) {
        setFastCode(result.fastCode);
        setPhase("success");
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

  function handleAccessMapSite() {
    const url = `${MAPSITE_DOMAIN}/ma/${fastCode.toLowerCase()}`;
    window.open(url, "_blank", "noopener,noreferrer");
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
    setFields({ firstName: "", lastName: "", email: "", phone: "", address: "" });
    setFieldErrors({});
  }

  function handlePartnerAccess() {
    const url = "/partner-access";
    if (window.top !== window) {
      window.top.location.href = url;
    } else {
      router.push(url);
    }
  }

  function setField(key: keyof FormFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    }
  }

  return (
    <div className="min-h-dvh bg-white font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white flex items-center justify-center">
      <div className="mx-auto max-w-lg w-full px-5 py-8 md:py-10">
        {/* HEADER */}
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="TalisPros"
            width={150}
            height={40}
            className="h-10 md:h-[52px] w-auto object-contain mx-auto mb-5"
            priority
          />
          <h1 className="text-2xl md:text-3xl font-light tracking-tight">Get Your Fast Code</h1>
          <p className="text-sm text-neutral-500 font-light mt-2 max-w-sm mx-auto">
            Enter your details to generate a unique Fast Code and access your MapSite™.
          </p>
        </div>

        {/* FORM PHASE */}
        {phase === "form" && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                placeholder="Meyer"
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
              placeholder="123 Main St, City, State ZIP"
              autoComplete="street-address"
            />

            {errorMsg && (
              <p className="text-xs font-medium text-red-500 text-center">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full h-14 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Generate Fast Code
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* SUCCESS PHASE */}
        {phase === "success" && (
          <div className="text-center space-y-6">
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
              Your MapSite is ready. Click below to access it.
            </p>

            <button
              onClick={handleAccessMapSite}
              className="w-full h-14 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-sm"
            >
              Access MapSite
              <ExternalLink className="w-4 h-4" />
            </button>

            <p className="text-xs text-neutral-400">
              Opens in a new tab — {MAPSITE_DOMAIN}/ma/{fastCode.toLowerCase()}
            </p>

            <button
              onClick={handleReset}
              className="text-xs font-medium text-neutral-400 hover:text-neutral-900 transition-colors underline underline-offset-2"
            >
              Generate another Fast Code
            </button>
          </div>
        )}

        {/* ERROR PHASE */}
        {phase === "error" && (
          <div className="text-center space-y-5">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
              <p className="text-sm font-medium text-red-700">{errorMsg}</p>
            </div>
            <button
              onClick={() => setPhase("form")}
              className="w-full h-14 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* SECONDARY ACCESS */}
        <div className="text-center space-y-4 mt-10 mb-6">
          <p className="text-sm text-neutral-500 font-light">
            Already have a Fast Code?
          </p>
          <button
            onClick={handlePartnerAccess}
            className="w-full h-12 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-sm"
          >
            Access MapSite&trade;
          </button>
        </div>

        {/* FOOTER NOTE */}
        <p className="text-center text-xs text-neutral-300 font-medium tracking-wider uppercase">
          TalisPros &mdash; Fast Code Onboarding
        </p>
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
