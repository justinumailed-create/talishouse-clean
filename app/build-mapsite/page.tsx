"use client";

import { useState, useEffect, useRef, useSyncExternalStore, FormEvent } from "react";
import {
  ChevronDown,
  Upload,
  Check,
  ArrowRight,
  AlertCircle,
  Copy,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { submitBuildRequest, type ActionResult as BuildResult } from "./actions";
import { registerFastCode, type ActionResult as FastCodeResult } from "@/app/fast-code/actions";
import HomePinLocationSection, {
  validateHomePinLocation,
} from "@/components/build-mapsite/HomePinLocationSection";
import { defaultHomePinLocationValues } from "@/components/build-mapsite/home-pin-types";

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

const ADPRE_TYPES = [
  { value: "single", label: "Single AdPro™ PIN", description: "Individual business placement." },
  { value: "up-to-10", label: "Up To 10 AdPro™ PINs", description: "Ideal for small teams and multi-location operators." },
  { value: "up-to-100", label: "Up To 100 AdPro™ PINs", description: "Suitable for brokerages, agencies, franchises and regional organizations." },
  { value: "unlimited", label: "Unlimited AdPro™ PINs", description: "Enterprise-scale deployment." },
];

const STORAGE_KEY = "talispros_build_mapsite";

interface FormData {
  date: string;
  email: string;
  accountType: string;
  fastCode: string;
  streetAddress: string;
  latitude: string;
  longitude: string;
  manualPlacement: boolean;
  reverseGeocodedAddress: string;
  pinWriteup: string;
  futurePinColor: string | null;
  futurePinIcon: string | null;
  futurePinBorder: string | null;
  futurePinLabel: string | null;
  futurePinWhiteCenter: boolean;
  futurePinAnimated: boolean;
  futurePinCategoryBadge: string | null;
  helpPreference: string;
  additionalComments: string;
  consentCommunications: boolean;
  consentData: boolean;
}

interface FileState {
  picture: File | null;
  logo: File | null;
  pinImage: File | null;
  ttvMonologuePdf: File | null;
  ttvBackgroundImage: File | null;
  tebWriteUpPdf: File | null;
  tebPictures: File[];
}

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const defaultForm: FormData = {
  date: todayString(),
  email: "",
  accountType: "",
  fastCode: "",
  ...defaultHomePinLocationValues,
  helpPreference: "",
  additionalComments: "",
  consentCommunications: false,
  consentData: false,
};

const defaultFiles: FileState = {
  picture: null,
  logo: null,
  pinImage: null,
  ttvMonologuePdf: null,
  ttvBackgroundImage: null,
  tebWriteUpPdf: null,
  tebPictures: [],
};

function SectionCard({
  number,
  title,
  description,
  children,
  isOpen,
  onToggle,
}: {
  number: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const id = `section-${number}`;
  return (
    <div className="border border-neutral-200 rounded-2xl bg-white overflow-hidden transition-shadow duration-200 hover:shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={id}
        className="w-full flex items-start gap-4 p-5 sm:p-6 text-left hover:bg-neutral-50/50 transition-colors"
      >
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-900 text-white text-xs font-semibold flex items-center justify-center mt-0.5">
          {number}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-neutral-500 mt-0.5">{description}</p>
          )}
        </div>
        <ChevronDown
          className={`flex-shrink-0 w-5 h-5 text-neutral-400 mt-1 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        id={id}
        role="region"
        className={`transition-all duration-200 ease-in-out ${
          isOpen
            ? "max-h-[5000px] opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="px-5 sm:px-6 pb-5 sm:pb-6">{children}</div>
      </div>
    </div>
  );
}

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function InputField({
  label,
  required,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
}: {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full h-11 px-4 bg-white border text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-xl ${
          error ? "border-red-300" : "border-neutral-200"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FileUpload({
  label,
  file,
  onChange,
  accept,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileName = file?.name || "";

  return (
    <div>
      <FieldLabel label={label} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-all"
      >
        <Upload className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 truncate">
          {fileName || "Click to upload"}
        </span>
        {file && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="text-xs text-red-400 hover:text-red-600 ml-2 flex-shrink-0"
          >
            Remove
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          onChange(f || null);
        }}
      />
    </div>
  );
}

function MultiFileUpload({
  label,
  files,
  onChange,
  accept,
}: {
  label: string;
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileNames = files.map((f) => f.name).join(", ");

  return (
    <div>
      <FieldLabel label={label} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-all"
      >
        <Upload className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 truncate">
          {fileNames || "Click to upload"}
        </span>
        {files.length > 0 && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="text-xs text-red-400 hover:text-red-600 ml-2 flex-shrink-0"
          >
            Remove all
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => {
          const selected = Array.from(e.target.files || []);
          onChange(selected);
        }}
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <FieldLabel label={label} />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 bg-white border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-xl resize-y"
      />
    </div>
  );
}

function loadStoredForm(): FormData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const stored = parsed.form ?? {};
      return {
        ...defaultForm,
        ...stored,
        streetAddress: stored.streetAddress ?? stored.homeAddress ?? "",
      };
    }
  } catch {
    // ignore corrupt data
  }
  return defaultForm;
}

function loadStoredFiles(): FileState {
  return defaultFiles;
}

function RegisterCta() {
  return (
    <a
      href="/register-account"
      className="block text-center px-6 py-6 mb-8 rounded-xl border-2 border-[#c92026] bg-white cursor-pointer hover:translate-y-[-2px] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all duration-200 ease-in-out no-underline"
    >
      <p className="text-[18px] leading-relaxed text-neutral-800 mb-4">
        Build a &apos;done-for-you&apos; MapSite™
        without obligation. We will follow
        up within two business days to
        optimize and publish.
      </p>
      <span className="block font-bold text-[20px] text-neutral-900">
        Register Account
      </span>
    </a>
  );
}

function FastCodeSidebar() {
  const [fcFirstName, setFcFirstName] = useState("");
  const [fcLastName, setFcLastName] = useState("");
  const [fcEmail, setFcEmail] = useState("");
  const [fcPhone, setFcPhone] = useState("");
  const [fcAddress, setFcAddress] = useState("");
  const [fcProvince, setFcProvince] = useState("");
  const [fcSubmitting, setFcSubmitting] = useState(false);
  const [fcError, setFcError] = useState("");
  const [fcCode, setFcCode] = useState("");
  const [fcCopied, setFcCopied] = useState(false);

  async function handleFastCode(e: FormEvent) {
    e.preventDefault();
    setFcError("");

    if (!fcFirstName.trim() || !fcLastName.trim() || !fcEmail.trim() || !fcPhone.trim() || !fcAddress.trim() || !fcProvince.trim()) {
      setFcError("All fields are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fcEmail.trim())) {
      setFcError("Invalid email format.");
      return;
    }

    setFcSubmitting(true);
    const result: FastCodeResult = await registerFastCode({
      firstName: fcFirstName,
      lastName: fcLastName,
      email: fcEmail,
      phone: fcPhone,
      address: fcAddress,
      province: fcProvince,
    });
    setFcSubmitting(false);

    if (result.success && result.fastCode) {
      setFcCode(result.fastCode);
    } else {
      setFcError(result.error || "Something went wrong.");
    }
  }

  function handleFcCopy() {
    navigator.clipboard.writeText(fcCode);
    setFcCopied(true);
    setTimeout(() => setFcCopied(false), 2000);
  }

  if (fcCode) {
    return (
      <div>
        <RegisterCta />
        <div className="text-center">
        <Image
          src="/logo.png"
          alt="TalisPros"
          width={120}
          height={32}
          className="h-7 w-auto object-contain mx-auto mb-6"
          priority
        />
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Check className="w-6 h-6 text-green-600" />
        </div>
        <p className="text-[11px] text-neutral-400 uppercase tracking-widest font-medium mb-2">
          Your Gateway Code
        </p>
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl font-bold tracking-tight text-neutral-900">
            {fcCode}
          </span>
          <button
            onClick={handleFcCopy}
            className="flex-shrink-0 w-8 h-8 border border-neutral-300 rounded-lg flex items-center justify-center hover:bg-neutral-100 transition-colors"
          >
            {fcCopied ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-neutral-400" />
            )}
          </button>
        </div>
        <p className="text-xs text-neutral-500">
          Use this code to access your MapSite™.
        </p>
      </div>
      </div>
    );
  }

  return (
    <div>
      <RegisterCta />
      <Image
        src="/logo.png"
        alt="TalisPros"
        width={120}
        height={32}
        className="h-7 w-auto object-contain mb-6"
        priority
      />
      <h2 className="text-lg font-semibold text-neutral-900 tracking-tight mb-1">
        Generate FAST Code
      </h2>
      <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
        Enter your details to be issued a unique Gateway.
      </p>

      <form onSubmit={handleFastCode} className="space-y-3.5">
        <div>
          <FieldLabel label="First Name" required />
          <input
            type="text"
            value={fcFirstName}
            onChange={(e) => setFcFirstName(e.target.value)}
            placeholder="John"
            className="w-full h-10 px-3.5 bg-white border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-lg"
          />
        </div>
        <div>
          <FieldLabel label="Last Name" required />
          <input
            type="text"
            value={fcLastName}
            onChange={(e) => setFcLastName(e.target.value)}
            placeholder="Smith"
            className="w-full h-10 px-3.5 bg-white border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-lg"
          />
        </div>
        <div>
          <FieldLabel label="Email" required />
          <input
            type="email"
            value={fcEmail}
            onChange={(e) => setFcEmail(e.target.value)}
            placeholder="john@example.com"
            className="w-full h-10 px-3.5 bg-white border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-lg"
          />
        </div>
        <div>
          <FieldLabel label="Cell Phone" required />
          <input
            type="tel"
            value={fcPhone}
            onChange={(e) => setFcPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className="w-full h-10 px-3.5 bg-white border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-lg"
          />
        </div>
        <div>
          <FieldLabel label="Street Address" required />
          <input
            type="text"
            value={fcAddress}
            onChange={(e) => setFcAddress(e.target.value)}
            placeholder="123 Main St"
            className="w-full h-10 px-3.5 bg-white border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-lg"
          />
        </div>
        <div>
          <FieldLabel label="State / Province" required />
          <select
            value={fcProvince}
            onChange={(e) => setFcProvince(e.target.value)}
            className={`w-full h-10 px-3.5 bg-white border border-neutral-200 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-lg appearance-none ${
              !fcProvince ? "text-neutral-400" : ""
            }`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              paddingRight: "32px",
            }}
          >
            <option value="">Select Province / State</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {fcError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{fcError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={fcSubmitting}
          className="w-full h-10 bg-neutral-900 text-white rounded-lg text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {fcSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              PROCEED
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function TurnstileWidget({
  onToken,
}: {
  onToken: (token: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      const id = setTimeout(() => setLoaded(true), 0);
      return () => clearTimeout(id);
    }

    if (document.getElementById("cf-turnstile-script")) {
      setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "cf-turnstile-script";
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);

    return () => {
      const el = document.getElementById("cf-turnstile-script");
      if (el) el.remove();
    };
  }, []);

  useEffect(() => {
    if (!loaded || !ref.current) return;
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      return;
    }
    const win = window as unknown as { turnstile?: { render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void }) => void } };
    if (win.turnstile) {
      win.turnstile.render(ref.current, {
        sitekey: siteKey,
        callback: onToken,
      });
    }
  }, [loaded, onToken]);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    return (
      <div className="border border-dashed border-neutral-300 rounded-xl p-4 text-center text-xs text-neutral-400">
        Turnstile widget — site key not configured
      </div>
    );
  }

  return <div ref={ref} />;
}

function AccountTypeSelector({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <FieldLabel label="Type of Account" required />
      <div className="space-y-2">
        {ADPRE_TYPES.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`w-full flex items-start gap-4 px-4 py-4 rounded-xl border text-left transition-all ${
                isActive
                  ? "border-neutral-900 bg-neutral-900/5"
                  : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              <span
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                  isActive
                    ? "border-neutral-900"
                    : "border-neutral-300"
                }`}
              >
                {isActive && <span className="w-2.5 h-2.5 rounded-full bg-neutral-900" />}
              </span>
              <div className="flex-1 min-w-0">
                <span
                  className={`block text-sm font-medium ${
                    isActive ? "text-neutral-900" : "text-neutral-700"
                  }`}
                >
                  {opt.label}
                </span>
                <span className="block text-xs text-neutral-500 mt-0.5 leading-relaxed">
                  {opt.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function BuildMapsitePage() {
  useEffect(() => {
    document.documentElement.style.height = "auto";
    document.body.style.minHeight = "auto";
    document.body.style.backgroundColor = "#ffffff";
  }, []);

  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openSections, setOpenSections] = useState<Set<number>>(
    new Set([1])
  );
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const [submitError, setSubmitError] = useState("");
  const [generatedFastCode, setGeneratedFastCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [form, setForm] = useState<FormData>(loadStoredForm);
  const [files, setFiles] = useState<FileState>(loadStoredFiles);

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ form })
      );
    }, 300);
    return () => clearTimeout(timeout);
  }, [form]);

  if (!hydrated) {
    return null;
  }

  function updateField<K extends keyof FormData>(
    key: K,
    value: FormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function updateFile(key: keyof FileState, file: File | null) {
    setFiles((prev) => ({ ...prev, [key]: file }));
  }

  function toggleSection(num: number) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(num)) {
        next.delete(num);
      } else {
        next.add(num);
      }
      return next;
    });
  }

  function validate(): boolean {
    const errs: Partial<Record<string, string>> = {};
    if (!form.email.trim()) errs.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = "Invalid email";
    if (!form.accountType) errs.accountType = "Select an account type";
    if (!form.fastCode.trim()) errs.fastCode = "Required";
    Object.assign(
      errs,
      validateHomePinLocation({
        streetAddress: form.streetAddress,
        latitude: form.latitude,
        longitude: form.longitude,
        manualPlacement: form.manualPlacement,
        reverseGeocodedAddress: form.reverseGeocodedAddress,
        pinWriteup: form.pinWriteup,
        futurePinColor: form.futurePinColor,
        futurePinIcon: form.futurePinIcon,
        futurePinBorder: form.futurePinBorder,
        futurePinLabel: form.futurePinLabel,
        futurePinWhiteCenter: form.futurePinWhiteCenter,
        futurePinAnimated: form.futurePinAnimated,
        futurePinCategoryBadge: form.futurePinCategoryBadge,
      })
    );
    if (!form.consentData) errs.consentData = "You must agree to the data processing terms";
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) errs.turnstile = "Please complete the security check";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleCopy() {
    if (!generatedFastCode) return;
    navigator.clipboard.writeText(generatedFastCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) {
      setOpenSections(new Set([1, 2, 3]));
      return;
    }

    setSaving(true);
    setSubmitError("");

    try {
      const fd = new FormData();
      fd.append("date", form.date);
      fd.append("email", form.email);
      fd.append("accountType", form.accountType);
      fd.append("fastCode", form.fastCode);
      fd.append("streetAddress", form.streetAddress);
      fd.append("latitude", form.latitude);
      fd.append("longitude", form.longitude);
      fd.append("manualPlacement", String(form.manualPlacement));
      fd.append("reverseGeocodedAddress", form.reverseGeocodedAddress);
      fd.append("pinWriteup", form.pinWriteup);
      fd.append("futurePinColor", form.futurePinColor ?? "");
      fd.append("futurePinIcon", form.futurePinIcon ?? "");
      fd.append("futurePinBorder", form.futurePinBorder ?? "");
      fd.append("futurePinLabel", form.futurePinLabel ?? "");
      fd.append("futurePinWhiteCenter", String(form.futurePinWhiteCenter));
      fd.append("futurePinAnimated", String(form.futurePinAnimated));
      fd.append("futurePinCategoryBadge", form.futurePinCategoryBadge ?? "");
      fd.append("helpPreference", form.helpPreference);
      fd.append("additionalComments", form.additionalComments);
      fd.append("consentCommunications", String(form.consentCommunications));
      fd.append("consentData", String(form.consentData));
      fd.append("turnstileToken", turnstileToken);
      if (files.picture) fd.append("picture", files.picture);
      if (files.logo) fd.append("logo", files.logo);
      if (files.pinImage) fd.append("pinImage", files.pinImage);
      if (files.ttvMonologuePdf) fd.append("ttvMonologuePdf", files.ttvMonologuePdf);
      if (files.ttvBackgroundImage) fd.append("ttvBackgroundImage", files.ttvBackgroundImage);
      if (files.tebWriteUpPdf) fd.append("tebWriteUpPdf", files.tebWriteUpPdf);
      for (let i = 0; i < files.tebPictures.length; i++) {
        fd.append(`tebPicture_${i}`, files.tebPictures[i]);
      }
      fd.append("helpPreference", form.helpPreference);

      const result: BuildResult = await submitBuildRequest(fd);

      if (result.success && result.fastCode) {
        setGeneratedFastCode(result.fastCode);
        localStorage.setItem(
          "talispros_build_mapsite_submitted",
          JSON.stringify({
            form,
            submittedAt: new Date().toISOString(),
            fastCode: result.fastCode,
          })
        );
        setSubmitted(true);
      } else {
        setSubmitError(result.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("[build-mapsite] Submit error:", err);
      setSubmitError(
        `Connection error: ${err instanceof Error ? err.message : "Unknown"}`
      );
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(defaultForm);
    setFiles(defaultFiles);
    setErrors({});
    setOpenSections(new Set([1]));
    setSubmitted(false);
    setSubmitError("");
    setGeneratedFastCode("");
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("talispros_build_mapsite_submitted");
  }

  if (!hydrated) {
    return null;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-lg text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight mb-3">
            Your Build A MapSite™ Request Has Been Received
          </h1>
          <p className="text-neutral-500 text-sm sm:text-base leading-relaxed mb-8 max-w-sm mx-auto">
            We will review your request and contact you within two business days.
          </p>

          <div className="border border-neutral-200 rounded-2xl bg-white p-6 sm:p-8 text-left mb-8">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">
              Request Number
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
                {generatedFastCode}
              </span>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 w-10 h-10 border border-neutral-300 rounded-xl flex items-center justify-center hover:bg-neutral-100 transition-colors"
                title="Copy Request Number"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-neutral-400" />
                )}
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-400 mb-1">Submitted as</p>
              <p className="text-sm text-neutral-900 font-medium">
                {form.email}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="w-full h-12 bg-[#2563eb] text-white rounded-xl text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-[#1d4ed8] active:scale-[0.98] transition-all"
            >
              Return to Home
            </Link>
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-neutral-400 hover:text-neutral-900 transition-colors underline underline-offset-2"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Top Navigation Bar */}
      <nav className="flex-shrink-0 bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6">
          <ul className="flex items-center justify-center gap-8 sm:gap-12 h-12 sm:h-14">
            {[
              { label: "Welcome", href: "/" },
              { label: "Claim a Market", href: "#" },
              { label: "Build a MapSite™", href: "/build-mapsite", active: true },
              { label: "Register Account", href: "/business-office/register" },
            ].map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className={`text-xs sm:text-[13px] font-medium tracking-wide transition-colors ${
                    item.active
                      ? "text-neutral-800"
                      : "text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — Build Form */}
        <div className="w-full lg:w-[75%] overflow-y-auto">
          <div className="max-w-2xl mx-auto px-5 py-8 sm:py-12 lg:py-16">
            <div className="text-center mb-8 sm:mb-10">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-neutral-900">
                Build A MapSite™
              </h1>
              <p className="text-sm sm:text-base text-neutral-500 mt-2 max-w-md mx-auto leading-relaxed">
                Set up your MapSite™ account. Enter the required information below
                and we will process your request within two business days.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <SectionCard
                number={1}
                title="General Information"
                description="Account identification and type."
                isOpen={openSections.has(1)}
                onToggle={() => toggleSection(1)}
              >
                <div className="space-y-4">
                  <InputField
                    label="Date"
                    required
                    type="date"
                    value={form.date}
                    onChange={(v) => updateField("date", v)}
                  />
                  <InputField
                    label="Email Address"
                    required
                    type="email"
                    value={form.email}
                    onChange={(v) => updateField("email", v)}
                    placeholder="john@example.com"
                    autoComplete="email"
                    error={errors.email}
                  />
                  <AccountTypeSelector
                    value={form.accountType}
                    onChange={(v) => updateField("accountType", v)}
                    error={errors.accountType}
                  />
                  <InputField
                    label="FAST Code"
                    required
                    value={form.fastCode}
                    onChange={(v) => updateField("fastCode", v)}
                    placeholder="e.g. JOHN-TORONTO"
                    error={errors.fastCode}
                  />
                  <p className="text-xs text-neutral-400 -mt-2">
                    Identifies an Account
                  </p>
                </div>
              </SectionCard>

              <SectionCard
                number={2}
                title="MapSite Personalization"
                description="Your branding assets."
                isOpen={openSections.has(2)}
                onToggle={() => toggleSection(2)}
              >
                <div className="space-y-4">
                  <FileUpload
                    label="Your Picture"
                    file={files.picture}
                    onChange={(f) => updateFile("picture", f)}
                    accept="image/*"
                  />
                  <FileUpload
                    label="Your Logo"
                    file={files.logo}
                    onChange={(f) => updateFile("logo", f)}
                    accept="image/*"
                  />
                </div>
              </SectionCard>

              <SectionCard
                number={3}
                title="Home PIN Location"
                description="Place your Home PIN with an optional address, coordinates, or by clicking the map. Coordinates are required — works for vacant land without a street address."
                isOpen={openSections.has(3)}
                onToggle={() => toggleSection(3)}
              >
                <HomePinLocationSection
                  values={{
                    streetAddress: form.streetAddress,
                    latitude: form.latitude,
                    longitude: form.longitude,
                    manualPlacement: form.manualPlacement,
                    reverseGeocodedAddress: form.reverseGeocodedAddress,
                    pinWriteup: form.pinWriteup,
                    futurePinColor: form.futurePinColor,
                    futurePinIcon: form.futurePinIcon,
                    futurePinBorder: form.futurePinBorder,
                    futurePinLabel: form.futurePinLabel,
                    futurePinWhiteCenter: form.futurePinWhiteCenter,
                    futurePinAnimated: form.futurePinAnimated,
                    futurePinCategoryBadge: form.futurePinCategoryBadge,
                  }}
                  pinImage={files.pinImage}
                  onChange={(values) => {
                    setForm((prev) => ({ ...prev, ...values }));
                    setErrors((prev) => {
                      const next = { ...prev };
                      for (const key of Object.keys(values)) {
                        delete next[key];
                      }
                      return next;
                    });
                  }}
                  onPinImageChange={(file) => updateFile("pinImage", file)}
                  errors={errors}
                />
              </SectionCard>

              <div className="py-6">
                <h3 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight mb-5">
                  Talis TV (TTV)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FileUpload
                    label="A Monologue in PDF"
                    file={files.ttvMonologuePdf}
                    onChange={(f) => updateFile("ttvMonologuePdf", f)}
                    accept=".pdf"
                  />
                  <FileUpload
                    label="A JPG or PNG background for your Monologue."
                    file={files.ttvBackgroundImage}
                    onChange={(f) => updateFile("ttvBackgroundImage", f)}
                    accept=".jpg,.jpeg,.png"
                  />
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed mt-4">
                  TTV Segments should be at least 90 seconds and no more than three minutes in length. As a rough estimate figure about 1,200 characters per minute. Segments over three minutes in length will be edited down.
                </p>
              </div>

              <div className="py-6">
                <h3 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight mb-5">
                  Talis E-Books (TEB)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FileUpload
                    label="A Write-Up in PDF."
                    file={files.tebWriteUpPdf}
                    onChange={(f) => updateFile("tebWriteUpPdf", f)}
                    accept=".pdf"
                  />
                  <MultiFileUpload
                    label="Up to 22 pictures for your E-Book."
                    files={files.tebPictures}
                    onChange={(f) => setFiles((prev) => ({ ...prev, tebPictures: f }))}
                    accept=".jpg,.jpeg,.png"
                  />
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed mt-4">
                  TEB Publications should be no less than 12 pages and no more than 22 pages, including covers. Pictures should be 16 over 9 in dimension (full HD) and landscape in orientation. Please rename pictures from P1 to P22 before submitting, that communicates to us in which order they should be used (P1 = Front Cover; P2 = Back Cover; P3..P22 inside pictures).
                </p>
              </div>

              <div className="py-6">
                <h3 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight mb-3">
                  Help Us Improve
                </h3>
                <p className="text-sm text-neutral-500 mb-1">
                  Possible future levels of media functionality.
                </p>
                <p className="text-xs text-neutral-400 mb-4">
                  Which best represents your preference?
                </p>
                <div className="space-y-3">
                  {[
                    {
                      value: "done-for-me",
                      label:
                        "I prefer the 'done-for-me' option: I provide images and write ups and my media is generated for me within 48 hours at a modest cost.",
                    },
                    {
                      value: "outsourced",
                      label:
                        "I prefer the 'outsourced' option: I can attach additional media I have created myself somewhere else at no additional cost.",
                    },
                    {
                      value: "real-time",
                      label:
                        "I prefer the 'real time' option: I can build my own online media in app in real time at a slightly less modest cost.",
                    },
                  ].map((opt) => {
                    const isActive = form.helpPreference === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateField("helpPreference", opt.value)}
                        className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left text-sm leading-relaxed transition-all ${
                          isActive
                            ? "border-neutral-900 bg-neutral-900/5 text-neutral-900"
                            : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                        }`}
                      >
                        <span
                          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                            isActive ? "border-neutral-900" : "border-neutral-300"
                          }`}
                        >
                          {isActive && (
                            <span className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
                          )}
                        </span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-5">
                  <TextAreaField
                    label="Additional Comments or Suggestions"
                    value={form.additionalComments}
                    onChange={(v) => updateField("additionalComments", v)}
                    placeholder="Enter your comments or suggestions..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="py-6">
                <h3 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight mb-4">
                  Terms
                </h3>

                <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
                  By checking the boxes below, you agree to receive communications from Talispros™. You can unsubscribe anytime.
                </p>

                <label className="flex items-start gap-3 cursor-pointer mb-5">
                  <input
                    type="checkbox"
                    checked={form.consentCommunications}
                    onChange={(e) => updateField("consentCommunications", e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <span className="text-sm text-neutral-600 leading-relaxed">
                    I agree to receive communications from Talispros™.
                  </span>
                </label>

                <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
                  To process your request, we need your permission to store and process your personal data. Please check the box below to confirm your consent:
                </p>

                <label className="flex items-start gap-3 cursor-pointer mb-5">
                  <input
                    type="checkbox"
                    checked={form.consentData}
                    onChange={(e) => updateField("consentData", e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <span className="text-sm text-neutral-600 leading-relaxed">
                    I agree to allow Talispros™ to store and process my personal data.{" "}
                    <span className="text-red-400">*</span>
                  </span>
                </label>
                {errors.consentData && (
                  <div className="flex items-center gap-2 text-sm text-red-500 mb-4">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errors.consentData}
                  </div>
                )}

                <p className="text-sm text-neutral-500 leading-relaxed">
                  We care about your privacy. Learn how we handle your data in our{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    className="text-neutral-900 underline underline-offset-2 hover:text-neutral-700"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>

              <div className="py-6">
                <TurnstileWidget onToken={setTurnstileToken} />
                {errors.turnstile && (
                  <div className="flex items-center gap-2 text-sm text-red-500 mt-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errors.turnstile}
                  </div>
                )}
              </div>

              <div className="pt-2 pb-8">
                {submitError && (
                  <div className="flex items-start gap-2 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto px-10 h-12 bg-[#2563eb] text-white rounded-xl text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-[#1d4ed8] active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
                  >
                    {saving ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      <>Submit</>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Panel — FAST Code Generator */}
        <div className="hidden lg:block lg:w-[25%] bg-[#fafafa] border-l border-[#e5e5e5] p-8 overflow-y-auto">
          <FastCodeSidebar />
        </div>
      </div>
    </div>
  );
}
