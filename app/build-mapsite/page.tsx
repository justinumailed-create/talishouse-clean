"use client";

import { useState, useEffect, useRef, useSyncExternalStore, FormEvent } from "react";
import {
  ChevronDown,
  Upload,
  Check,
  ArrowRight,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { submitBuildRequest, type ActionResult as BuildResult } from "./actions";
import { registerFastCode, type ActionResult as FastCodeResult } from "@/app/fast-code/actions";

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

const HERO_OPTIONS = [
  { value: "map", label: "Interactive Map" },
  { value: "image", label: "Hero Image" },
  { value: "video", label: "Hero Video" },
  { value: "pdf", label: "PDF Brochure" },
];

const MEDIA_FOCUS_OPTIONS = [
  { value: "residential", label: "Residential" },
  { value: "recreational", label: "Recreational" },
  { value: "commercial", label: "Commercial / Wholesale" },
  { value: "land", label: "Land / Development" },
  { value: "hybrid", label: "Hybrid / Mixed-Use" },
];

const FUTURE_FEATURES = [
  { value: "ecommerce", label: "E-Commerce Integration" },
  { value: "booking", label: "Booking / Scheduling" },
  { value: "analytics", label: "Advanced Analytics" },
  { value: "multi_lang", label: "Multi-Language Support" },
  { value: "virtual_tour", label: "Virtual Tour / 3D Walkthrough" },
  { value: "lead_api", label: "Lead API / CRM Sync" },
  { value: "custom_domain", label: "Custom Domain" },
  { value: "ssr", label: "SEO / SSR Optimization" },
];

const ACCOUNT_TYPES = [
  { value: "individual", label: "Individual / Solo" },
  { value: "team", label: "Small Team (2-5)" },
  { value: "agency", label: "Agency / Brokerage" },
  { value: "developer", label: "Developer / Builder" },
];

const STORAGE_KEY = "talispros_build_mapsite";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  accountType: string;
  preferredFastCode: string;
  mapsiteTitle: string;
  mapsiteTagline: string;
  heroType: string;
  mediaFocus: string[];
  futureFeatures: string[];
  comments: string;
  consent: boolean;
}

interface FileState {
  profileImage: File | null;
  logoImage: File | null;
  pinImage: File | null;
  monologuePdf: File | null;
  ebookPdf: File | null;
}

const defaultForm: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  country: "Canada",
  accountType: "",
  preferredFastCode: "",
  mapsiteTitle: "",
  mapsiteTagline: "",
  heroType: "map",
  mediaFocus: [],
  futureFeatures: [],
  comments: "",
  consent: false,
};

const defaultFiles: FileState = {
  profileImage: null,
  logoImage: null,
  pinImage: null,
  monologuePdf: null,
  ebookPdf: null,
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
            ? "max-h-[2000px] opacity-100"
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

function SelectField({
  label,
  required,
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-11 px-4 bg-white border text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-xl appearance-none ${
          error ? "border-red-300" : "border-neutral-200"
        } ${!value ? "text-neutral-400" : ""}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 16px center",
          paddingRight: "40px",
        }}
      >
        <option value="">{placeholder || "Select..."}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div>
      <FieldLabel label={label} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => {
          const isActive = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all ${
                isActive
                  ? "border-neutral-900 bg-neutral-900/5 text-neutral-900 font-medium"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              <span
                className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-neutral-900 border-neutral-900"
                    : "border-neutral-300"
                }`}
              >
                {isActive && <Check className="w-3.5 h-3.5 text-white" />}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
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

function ProvinceSelect({
  value,
  onChange,
  country,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  country: string;
  error?: string;
}) {
  const options = country === "United States" ? US_STATES : PROVINCES;
  const label = country === "United States" ? "State" : "Province";

  return (
    <div>
      <FieldLabel label={label} required />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-11 px-4 bg-white border text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-xl appearance-none ${
          error ? "border-red-300" : "border-neutral-200"
        } ${!value ? "text-neutral-400" : ""}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 16px center",
          paddingRight: "40px",
        }}
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function CountrySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <FieldLabel label="Country" required />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-4 bg-white border border-neutral-200 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-xl appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 16px center",
          paddingRight: "40px",
        }}
      >
        <option value="Canada">Canada</option>
        <option value="United States">United States</option>
      </select>
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
      return { ...defaultForm, ...parsed.form };
    }
  } catch {
    // ignore corrupt data
  }
  return defaultForm;
}

function loadStoredFiles(): FileState {
  return defaultFiles;
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
    );
  }

  return (
    <div>
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
    if (!form.firstName.trim()) errs.firstName = "Required";
    if (!form.lastName.trim()) errs.lastName = "Required";
    if (!form.email.trim()) errs.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = "Invalid email";
    if (!form.phone.trim()) errs.phone = "Required";
    if (!form.province.trim()) errs.province = "Required";
    if (!form.accountType) errs.accountType = "Select an account type";
    if (!form.consent) errs.consent = "You must agree to continue";
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
      setOpenSections(new Set([1, 2, 3, 4, 5, 6, 7, 8]));
      return;
    }

    setSaving(true);
    setSubmitError("");

    try {
      const fd = new FormData();
      fd.append("firstName", form.firstName);
      fd.append("lastName", form.lastName);
      fd.append("email", form.email);
      fd.append("phone", form.phone);
      fd.append("address", form.address);
      fd.append("city", form.city);
      fd.append("province", form.province);
      fd.append("postalCode", form.postalCode);
      fd.append("country", form.country);
      fd.append("accountType", form.accountType);
      fd.append("preferredFastCode", form.preferredFastCode);
      fd.append("mapsiteTitle", form.mapsiteTitle);
      fd.append("mapsiteTagline", form.mapsiteTagline);
      fd.append("heroType", form.heroType);
      fd.append("mediaFocus", JSON.stringify(form.mediaFocus));
      fd.append("futureFeatures", JSON.stringify(form.futureFeatures));
      fd.append("comments", form.comments);
      if (files.profileImage) fd.append("profileImage", files.profileImage);
      if (files.logoImage) fd.append("logoImage", files.logoImage);
      if (files.pinImage) fd.append("pinImage", files.pinImage);
      if (files.monologuePdf) fd.append("monologuePdf", files.monologuePdf);
      if (files.ebookPdf) fd.append("ebookPdf", files.ebookPdf);

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
            MapSite™ Request Submitted
          </h1>
          <p className="text-neutral-500 text-sm sm:text-base leading-relaxed mb-8 max-w-sm mx-auto">
            Your MapSite™ build request has been received. We will follow up
            within two business days to optimize and publish your MapSite™.
          </p>

          <div className="border border-neutral-200 rounded-2xl bg-white p-6 sm:p-8 text-left mb-8">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">
              Your Fast Code
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
                {generatedFastCode}
              </span>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 w-10 h-10 border border-neutral-300 rounded-xl flex items-center justify-center hover:bg-neutral-100 transition-colors"
                title="Copy Fast Code"
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
                {form.firstName} {form.lastName}
              </p>
              <p className="text-sm text-neutral-500">{form.email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={`https://talispros.com/ma/${generatedFastCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all"
            >
              Access Your MapSite™
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-neutral-400 hover:text-neutral-900 transition-colors underline underline-offset-2"
            >
              Build Another MapSite™
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
                Build a done-for-you MapSite™ without obligation. We will follow up
                within two business days to optimize and publish.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <SectionCard
                number={1}
                title="General Information"
                description="Your contact details and account setup."
                isOpen={openSections.has(1)}
                onToggle={() => toggleSection(1)}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="First Name"
                      required
                      value={form.firstName}
                      onChange={(v) => updateField("firstName", v)}
                      placeholder="John"
                      autoComplete="given-name"
                      error={errors.firstName}
                    />
                    <InputField
                      label="Last Name"
                      required
                      value={form.lastName}
                      onChange={(v) => updateField("lastName", v)}
                      placeholder="Smith"
                      autoComplete="family-name"
                      error={errors.lastName}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Email"
                      required
                      type="email"
                      value={form.email}
                      onChange={(v) => updateField("email", v)}
                      placeholder="john@example.com"
                      autoComplete="email"
                      error={errors.email}
                    />
                    <InputField
                      label="Phone"
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(v) => updateField("phone", v)}
                      placeholder="(555) 123-4567"
                      autoComplete="tel"
                      error={errors.phone}
                    />
                  </div>
                  <InputField
                    label="Street Address"
                    value={form.address}
                    onChange={(v) => updateField("address", v)}
                    placeholder="123 Main St"
                    autoComplete="street-address"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InputField
                      label="City"
                      value={form.city}
                      onChange={(v) => updateField("city", v)}
                      placeholder="Toronto"
                      autoComplete="address-level2"
                    />
                    <ProvinceSelect
                      value={form.province}
                      onChange={(v) => updateField("province", v)}
                      country={form.country}
                      error={errors.province}
                    />
                    <InputField
                      label="Postal Code"
                      value={form.postalCode}
                      onChange={(v) => updateField("postalCode", v)}
                      placeholder="A1A 1A1"
                      autoComplete="postal-code"
                    />
                  </div>
                  <CountrySelect
                    value={form.country}
                    onChange={(v) => updateField("country", v)}
                  />
                  <SelectField
                    label="Account Type"
                    required
                    value={form.accountType}
                    onChange={(v) => updateField("accountType", v)}
                    options={ACCOUNT_TYPES}
                    placeholder="Select account type"
                    error={errors.accountType}
                  />
                </div>
              </SectionCard>

              <SectionCard
                number={2}
                title="MapSite™ Personalization"
                description="Customize your MapSite™ look and feel."
                isOpen={openSections.has(2)}
                onToggle={() => toggleSection(2)}
              >
                <div className="space-y-4">
                  <InputField
                    label="Preferred Fast Code"
                    value={form.preferredFastCode}
                    onChange={(v) => updateField("preferredFastCode", v)}
                    placeholder="e.g. JOHN-TORONTO"
                  />
                  <InputField
                    label="MapSite™ Title / Headline"
                    value={form.mapsiteTitle}
                    onChange={(v) => updateField("mapsiteTitle", v)}
                    placeholder="Your main headline"
                  />
                  <InputField
                    label="MapSite™ Tagline / Subtext"
                    value={form.mapsiteTagline}
                    onChange={(v) => updateField("mapsiteTagline", v)}
                    placeholder="A short description of your market"
                  />
                  <SelectField
                    label="Hero Content Type"
                    value={form.heroType}
                    onChange={(v) => updateField("heroType", v)}
                    options={HERO_OPTIONS}
                  />
                </div>
              </SectionCard>

              <SectionCard
                number={3}
                title="Media Focus"
                description="What type of properties or market will your MapSite™ highlight?"
                isOpen={openSections.has(3)}
                onToggle={() => toggleSection(3)}
              >
                <CheckboxGroup
                  label="Focus Areas"
                  options={MEDIA_FOCUS_OPTIONS}
                  selected={form.mediaFocus}
                  onChange={(v) => updateField("mediaFocus", v)}
                />
              </SectionCard>

              <SectionCard
                number={4}
                title="TTV Uploads"
                description="Upload your TalisTV media assets."
                isOpen={openSections.has(4)}
                onToggle={() => toggleSection(4)}
              >
                <div className="space-y-4">
                  <FileUpload
                    label="Profile Image"
                    file={files.profileImage}
                    onChange={(f) => updateFile("profileImage", f)}
                    accept="image/*"
                  />
                  <FileUpload
                    label="Logo Image"
                    file={files.logoImage}
                    onChange={(f) => updateFile("logoImage", f)}
                    accept="image/*"
                  />
                  <FileUpload
                    label="Pin Image (Map Marker)"
                    file={files.pinImage}
                    onChange={(f) => updateFile("pinImage", f)}
                    accept="image/*"
                  />
                </div>
              </SectionCard>

              <SectionCard
                number={5}
                title="TEB Uploads"
                description="Upload your Talis E-Book and presentation assets."
                isOpen={openSections.has(5)}
                onToggle={() => toggleSection(5)}
              >
                <div className="space-y-4">
                  <FileUpload
                    label="Monologue / Script (PDF)"
                    file={files.monologuePdf}
                    onChange={(f) => updateFile("monologuePdf", f)}
                    accept=".pdf"
                  />
                  <FileUpload
                    label="E-Book (PDF)"
                    file={files.ebookPdf}
                    onChange={(f) => updateFile("ebookPdf", f)}
                    accept=".pdf"
                  />
                </div>
              </SectionCard>

              <SectionCard
                number={6}
                title="Future Preferences"
                description="What features would you like to see on your MapSite™?"
                isOpen={openSections.has(6)}
                onToggle={() => toggleSection(6)}
              >
                <div className="space-y-4">
                  <CheckboxGroup
                    label="Desired Features"
                    options={FUTURE_FEATURES}
                    selected={form.futureFeatures}
                    onChange={(v) => updateField("futureFeatures", v)}
                  />
                </div>
              </SectionCard>

              <SectionCard
                number={7}
                title="Additional Comments"
                description="Anything else we should know about your MapSite™?"
                isOpen={openSections.has(7)}
                onToggle={() => toggleSection(7)}
              >
                <TextAreaField
                  label="Comments"
                  value={form.comments}
                  onChange={(v) => updateField("comments", v)}
                  placeholder="Tell us about your vision, target market, or any specific requirements..."
                  rows={5}
                />
              </SectionCard>

              <SectionCard
                number={8}
                title="Consent"
                description="Review and agree to our terms."
                isOpen={openSections.has(8)}
                onToggle={() => toggleSection(8)}
              >
                <div className="space-y-5">
                  <div className="bg-neutral-50 rounded-xl p-4 text-sm text-neutral-600 leading-relaxed space-y-2">
                    <p>
                      By submitting this form, you consent to TalisPros processing
                      your information to build and manage your MapSite™. We will
                      follow up within two business days to optimize and publish your
                      MapSite™.
                    </p>
                    <p>
                      Your data will be handled in accordance with our{" "}
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
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={(e) =>
                        updateField("consent", e.target.checked)
                      }
                      className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                    />
                    <span className="text-sm text-neutral-600 leading-relaxed">
                      I agree to the terms and consent to the processing of my data
                      for the purpose of building and managing my MapSite™.{" "}
                      <span className="text-red-400">*</span>
                    </span>
                  </label>
                  {errors.consent && (
                    <div className="flex items-center gap-2 text-sm text-red-500">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {errors.consent}
                    </div>
                  )}
                </div>
              </SectionCard>

              <div className="pt-2 pb-8">
                {submitError && (
                  <div className="flex items-start gap-2 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-12 sm:h-14 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
                >
                  {saving ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    <>
                      Submit MapSite™ Request
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-xs text-neutral-400 text-center mt-3">
                  Your progress is saved automatically.
                </p>
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
