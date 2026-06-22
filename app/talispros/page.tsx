"use client";

import { useState, FormEvent } from "react";
import {
  Check,
  ArrowRight,
  AlertCircle,
  Copy,
} from "lucide-react";
import Image from "next/image";

const PROVINCES = [
  "Ontario", "British Columbia", "Alberta", "Quebec",
  "Nova Scotia", "Manitoba", "Saskatchewan", "New Brunswick",
  "Prince Edward Island", "Newfoundland and Labrador",
  "Northwest Territories", "Nunavut", "Yukon",
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

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function RegisterCta() {
  return (
    <a
      href="/talispros/register"
      className="block text-center px-6 py-6 mb-8 rounded-xl border-2 border-[#c92026] bg-white cursor-pointer hover:translate-y-[-2px] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all duration-200 ease-in-out no-underline"
    >
      <p className="text-[18px] leading-relaxed text-neutral-800 mb-4">
        Our Mapsites™ are industry adjacent market places that can formalize referral and co-promotion networks in real estate.
      </p>
      <a
        href="#welcome-content"
        className="block font-bold text-[20px] text-neutral-900 hover:text-neutral-700 transition-colors"
      >
        Explore Further
      </a>
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
    const result = await new Promise<{ success: boolean; fastCode?: string; error?: string }>((resolve) => {
      setTimeout(() => {
        resolve({ success: true, fastCode: "FAST-12345" });
      }, 1000);
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
          <Image src="/logo.png" alt="TalisPros™" width={120} height={32} className="h-7 w-auto object-contain mx-auto mb-6" priority />
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-[11px] text-neutral-400 uppercase tracking-widest font-medium mb-2">Your Gateway Code</p>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl font-bold tracking-tight text-neutral-900">{fcCode}</span>
            <button onClick={handleFcCopy} className="flex-shrink-0 w-8 h-8 border border-neutral-300 rounded-lg flex items-center justify-center hover:bg-neutral-100 transition-colors">
              {fcCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
            </button>
          </div>
          <p className="text-xs text-neutral-500">Use this code to access your MapSite™.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <RegisterCta />
      <Image src="/logo.png" alt="TalisPros™" width={120} height={32} className="h-7 w-auto object-contain mb-6" priority />
      <h2 className="text-lg font-semibold text-neutral-900 tracking-tight mb-1">Generate FAST Code</h2>
      <p className="text-sm text-neutral-500 mb-6 leading-relaxed">Enter your details to be issued a unique Gateway.</p>
      <form onSubmit={handleFastCode} className="space-y-3.5">
        <div>
          <FieldLabel label="First Name" required />
          <input type="text" value={fcFirstName} onChange={(e) => setFcFirstName(e.target.value)} placeholder="John" className="w-full h-10 px-3.5 bg-white border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-lg" />
        </div>
        <div>
          <FieldLabel label="Last Name" required />
          <input type="text" value={fcLastName} onChange={(e) => setFcLastName(e.target.value)} placeholder="Smith" className="w-full h-10 px-3.5 bg-white border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-lg" />
        </div>
        <div>
          <FieldLabel label="Email" required />
          <input type="email" value={fcEmail} onChange={(e) => setFcEmail(e.target.value)} placeholder="john@example.com" className="w-full h-10 px-3.5 bg-white border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-lg" />
        </div>
        <div>
          <FieldLabel label="Cell Phone" required />
          <input type="tel" value={fcPhone} onChange={(e) => setFcPhone(e.target.value)} placeholder="(555) 123-4567" className="w-full h-10 px-3.5 bg-white border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-lg" />
        </div>
        <div>
          <FieldLabel label="Street Address" required />
          <input type="text" value={fcAddress} onChange={(e) => setFcAddress(e.target.value)} placeholder="123 Main St" className="w-full h-10 px-3.5 bg-white border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-lg" />
        </div>
        <div>
          <FieldLabel label="State / Province" required />
          <select
            value={fcProvince} onChange={(e) => setFcProvince(e.target.value)}
            className={`w-full h-10 px-3.5 bg-white border border-neutral-200 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all rounded-lg appearance-none ${!fcProvince ? "text-neutral-400" : ""}`}
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "32px" }}
          >
            <option value="">Select Province / State</option>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {fcError && <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span>{fcError}</span></div>}
        <button type="submit" disabled={fcSubmitting} className="w-full h-10 bg-neutral-900 text-white rounded-lg text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50">
          {fcSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>PROCEED<ArrowRight className="w-3.5 h-3.5" /></>}
        </button>
      </form>
    </div>
  );
}

export default function TalisprosWelcomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Main Content — 75/25 Layout */}
      <div className="flex flex-1 overflow-hidden" id="welcome-content">
        {/* Left Panel — Welcome Content */}
        <div className="w-full lg:w-[75%] overflow-y-auto">
          <div className="max-w-2xl mx-auto px-5 py-12 sm:py-16 lg:py-20">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 mb-3">
                Talispros™ PMC
              </h1>
              <p className="text-sm sm:text-base text-neutral-500 max-w-xl mx-auto leading-relaxed">
                Industry Adjacent Market Places for Real Estate Professionals
              </p>
            </div>

            <hr className="border-t border-neutral-200 mb-12" />

            {/* Placeholder Content Sections */}
            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 mb-4">
                Why work with us…?
              </h2>
              <ul className="space-y-3">
                {[
                  "Decades of experience in modular construction and real estate markets.",
                  "Monthly content support to keep your MapSite™ fresh and engaging.",
                  "Ancillary marketing benefits including co-promotion and referral networks.",
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-neutral-600 leading-relaxed">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center mt-0.5">✓</span>
                    {text}
                  </li>
                ))}
              </ul>
            </section>

            <hr className="border-t border-neutral-200 mb-12" />

            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 mb-4">
                Hyper-Local Lead Generation
              </h2>
              <div className="text-sm text-neutral-600 leading-relaxed space-y-4">
                <p>
                  MapSite™ puts you at the center of your local market with a dedicated property discovery page that attracts qualified buyers and sellers in your area.
                </p>
              </div>
            </section>

            <hr className="border-t border-neutral-200 mb-12" />

            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 mb-4">
                Exclusive Audience Access
              </h2>
              <div className="text-sm text-neutral-600 leading-relaxed space-y-4">
                <p>
                  Gain access to an audience of motivated buyers and investors actively seeking modular and prefab solutions.
                </p>
              </div>
            </section>

            <hr className="border-t border-neutral-200 mb-12" />

            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 mb-4">
                Enhanced Authority and Trust
              </h2>
              <div className="text-sm text-neutral-600 leading-relaxed space-y-4">
                <p>
                  In an industry where trust is everything, a professionally designed MapSite™ positions you as a credible, established professional.
                </p>
              </div>
            </section>

            <hr className="border-t border-neutral-200 mb-12" />

            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 mb-4">
                Cost Effective Marketing
              </h2>
              <div className="text-sm text-neutral-600 leading-relaxed space-y-4">
                <p>
                  Traditional real estate marketing — billboards, print ads, mailers — can cost thousands and offer uncertain returns.
                </p>
              </div>
            </section>

            <hr className="border-t border-neutral-200 mb-12" />

            <section className="mb-16 text-center">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 mb-3">
                Ready to build your MapSite™?
              </h2>
              <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto leading-relaxed">
                Click below to start building your MapSite™ — a done-for-you property discovery page.
              </p>
              <a
                href="/talispros/build-mapsite"
                className="inline-flex h-12 px-8 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wide items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all"
              >
                Build My MapSite™
              </a>
            </section>

            <hr className="border-t border-neutral-200 mb-12" />

            {/* Products Section */}
            <section className="mb-16">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 text-center mb-10">
                Talispros™ Products
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "MapSites™", description: "Industry-adjacent marketplaces.", href: "/talispros/build-mapsite" },
                  { title: "FAST Codes™", description: "Universal account access and routing.", href: "/fast-code" },
                  { title: "TalisForms™", description: "Enterprise forms infrastructure.", href: "/talispros/forms" },
                  { title: "Adpros™", description: "Market activation and advertising.", href: "#" },
                  { title: "Partner Access™", description: "Referral and co-promotion networks.", href: "/partner-access" },
                ].map((product) => (
                  <a key={product.title} href={product.href}
                    className="block bg-neutral-50 rounded-2xl p-6 border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all no-underline"
                  >
                    <h3 className="text-base font-semibold text-neutral-900 mb-1">{product.title}</h3>
                    <p className="text-sm text-neutral-500 leading-relaxed">{product.description}</p>
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Right Panel — CTA Card + FAST Code Generator (Sticky) */}
        <div className="hidden lg:block lg:w-[25%] bg-[#fafafa] border-l border-[#e5e5e5] p-8 overflow-y-auto sticky top-0 self-start max-h-screen">
          <FastCodeSidebar />
        </div>
      </div>

      {/* Footer */}
      <footer className="flex-shrink-0 bg-white border-t border-neutral-200 py-6 text-center">
        <p className="text-xs text-neutral-400">
          Powered by{" "}
          <a href="/talispros/forms" className="text-neutral-600 hover:text-neutral-900 underline underline-offset-2 transition-colors">
            TalisForms™
          </a>
          <br />
          <span className="text-[10px] text-neutral-300">A Talispros™ Product</span>
        </p>
      </footer>
    </div>
  );
}
