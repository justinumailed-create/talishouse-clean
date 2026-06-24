"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, ArrowRight, AlertCircle, Copy } from "lucide-react";

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
      <div className="text-center">
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
    );
  }

  return (
    <div>
      <Image src="/logo.png" alt="TalisPros™" width={120} height={32} className="h-7 w-auto object-contain mb-4" priority />
      <form onSubmit={handleFastCode} className="space-y-3">
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
          {fcSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Generate<ArrowRight className="w-3.5 h-3.5" /></>}
        </button>
      </form>
    </div>
  );
}

export default function TalisprosWelcomePage() {
  return (
    <div className="flex flex-col h-screen bg-white font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
        {/* Main Content */}
        <div className="w-full lg:w-[70%] lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-2xl mx-auto px-5 py-8 sm:py-12 lg:py-16">
            {/* Hero */}
            <section className="text-center mb-12 sm:mb-16">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-neutral-900 mb-4">
                TalisPros™ PMC
              </h1>
              <p className="text-base sm:text-lg text-neutral-500 mb-3">
                Industry Adjacent Market Places for Real Estate Professionals
              </p>
            </section>

            <hr className="border-t border-neutral-200 mb-12 sm:mb-16" />

            {/* Hero Image Placeholder */}
            <div className="mt-12 mb-12">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-neutral-100">
                <Image
                  src="/images/mapsite-bottom-right.jpg"
                  alt="TalisPros™ PMC"
                  fill
                  className="object-cover"
                  sizes="(max-width: 672px) 100vw, 672px"
                />
              </div>
            </div>

            {/* Why work with us */}
            <section className="mb-12 sm:mb-16">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 mb-6">
                Why work with us&hellip;
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

            <hr className="border-t border-neutral-200 mb-12 sm:mb-16" />

            {/* Hyper-Local Lead Generation */}
            <section className="mb-12 sm:mb-16">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 mb-4">
                Hyper-Local Lead Generation
              </h2>
              <div className="text-sm text-neutral-600 leading-relaxed space-y-4">
                <p>
                  MapSite™ puts you at the center of your local market with a dedicated property discovery page that attracts qualified buyers and sellers in your area.
                </p>
              </div>
            </section>

            <hr className="border-t border-neutral-200 mb-12 sm:mb-16" />

            {/* Exclusive Audience Access */}
            <section className="mb-12 sm:mb-16">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 mb-4">
                Exclusive Audience Access
              </h2>
              <div className="text-sm text-neutral-600 leading-relaxed space-y-4">
                <p>
                  Gain access to an audience of motivated buyers and investors actively seeking modular and prefab solutions.
                </p>
              </div>
            </section>

            <hr className="border-t border-neutral-200 mb-12 sm:mb-16" />

            {/* Enhanced Authority and Trust */}
            <section className="mb-12 sm:mb-16">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 mb-4">
                Enhanced Authority and Trust
              </h2>
              <div className="text-sm text-neutral-600 leading-relaxed space-y-4">
                <p>
                  In an industry where trust is everything, a professionally designed MapSite™ positions you as a credible, established professional.
                </p>
              </div>
            </section>

            <hr className="border-t border-neutral-200 mb-12 sm:mb-16" />

            {/* Cost Effective Marketing */}
            <section className="mb-12 sm:mb-16">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 mb-4">
                Cost Effective Marketing
              </h2>
              <div className="text-sm text-neutral-600 leading-relaxed space-y-4">
                <p>
                  Traditional real estate marketing — billboards, print ads, mailers — can cost thousands and offer uncertain returns.
                </p>
              </div>
            </section>

            <hr className="border-t border-neutral-200 mb-12 sm:mb-16" />

            {/* Ready to build */}
            <section className="text-center mb-12 sm:mb-16">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 mb-3">
                Ready to build your MapSite™?
              </h2>
              <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto leading-relaxed">
                Click below to start building your MapSite™ — a done-for-you property discovery page.
              </p>
              <Link
                href="/talispros/build-mapsite"
                className="inline-flex h-12 px-8 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wide items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all"
              >
                Build My MapSite™
              </Link>
            </section>

            <hr className="border-t border-neutral-200 mb-12 sm:mb-16" />

            {/* Products */}
            <section className="mb-12 sm:mb-16">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 text-center mb-8">
                TalisPros™ Products
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
                    className="block bg-neutral-50 rounded-2xl p-5 border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all no-underline"
                  >
                    <h3 className="text-sm font-semibold text-neutral-900 mb-1">{product.title}</h3>
                    <p className="text-xs text-neutral-500 leading-relaxed">{product.description}</p>
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-[30%] bg-[#f7f8fa] lg:border-l border-[#e5e5e5] p-8 lg:sticky lg:top-0 lg:self-start lg:max-h-screen lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="space-y-6">
            {/* CTA Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-red-400 text-center">
              <p className="text-sm text-neutral-900 leading-relaxed mb-4">
                Our MapSites™ are industry adjacent market places that can formalize referral and co-promotion networks in real estate.
              </p>
              <Link
                href="/talispros/claim-a-market"
                className="inline-flex h-10 px-6 bg-neutral-900 text-white rounded-lg text-sm font-medium tracking-wide items-center justify-center gap-1.5 hover:bg-neutral-800 active:scale-[0.98] transition-all"
              >
                <span>Explore further</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* FAST Code™ */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-base font-semibold text-neutral-900 mb-1">FAST Code™</h3>
              <p className="text-xs text-neutral-500 mb-4">Generate your marketplace gateway.</p>
              <FastCodeSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
