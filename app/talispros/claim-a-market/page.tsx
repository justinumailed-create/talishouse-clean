import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { formatCAD } from "@/utils/currency";
import FastCodeSidebarCard from "@/components/talispros/FastCodeSidebarCard";

const BENEFITS = [
  {
    title: "Market Visibility",
    description: "Establish a prominent presence inside a TalisMaps™ marketplace where buyers and sellers actively search.",
  },
  {
    title: "Referral Networks",
    description: "Access built-in referral ecosystems that connect professionals across adjacent industry verticals.",
  },
  {
    title: "Industry Adjacent Exposure",
    description: "Position yourself in marketplaces frequented by modular construction, real estate, and property professionals.",
  },
  {
    title: "FAST Code Access",
    description: "Receive a unique FAST Code that serves as your universal gateway for account access and market routing.",
  },
  {
    title: "MapSite™ Presence",
    description: "Own a dedicated MapSite™ — a property discovery page that showcases your listings and services.",
  },
  {
    title: "Lead Generation",
    description: "Capture qualified leads through your MapSite™ with built-in contact forms and discovery tools.",
  },
];

const ADPRE_PACKAGES = [
  { label: "Single PIN", price: 49.95 },
  { label: "Up To 10 PINs", price: 249.95 },
  { label: "Up To 100 PINs", price: 499.95 },
  { label: "Unlimited", price: 999.95 },
];

export default function ClaimAMarketPage() {
  return (
    <div className="flex flex-col h-screen bg-white font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
        {/* Main Content */}
        <div className="w-full lg:w-[70%] lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-2xl mx-auto px-5 py-8 sm:py-12 lg:py-16">
          {/* Hero */}
          <section className="text-center mb-12 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-neutral-900 mb-4">
              Claim A Market™
            </h1>
            <p className="text-base sm:text-lg text-neutral-500 mb-3">
              Establish your presence inside a TalisMaps™ marketplace.
            </p>
            <p className="text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed mb-8">
              Root Accounts™, Derivative Accounts™, and AdPro™ placements
              allow professionals and organizations to participate in
              industry-adjacent marketplaces powered by TalisPros™.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#pricing"
                className="inline-flex h-12 px-8 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wide items-center justify-center hover:bg-neutral-800 active:scale-[0.98] transition-all"
              >
                Claim Your Market™
              </a>
              <a
                href="#benefits"
                className="inline-flex h-12 px-8 border border-neutral-300 text-neutral-700 rounded-xl text-sm font-medium tracking-wide items-center justify-center hover:bg-neutral-50 active:scale-[0.98] transition-all"
              >
                View Account Options
              </a>
            </div>
          </section>

          {/* Benefits */}
          <section id="benefits" className="mb-16">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 text-center mb-8">
              Why Claim A Market™
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BENEFITS.map((b) => (
                <div key={b.title} className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1">{b.title}</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">{b.description}</p>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-t border-neutral-200 mb-16" />

          {/* Root Account™ */}
          <section id="pricing" className="mb-12">
            <div className="rounded-2xl border-2 border-neutral-200 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">Root Account™</h2>
                  <p className="text-sm text-neutral-500 mt-1">Market ownership and full platform access.</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-neutral-900">{formatCAD(998.50)}</div>
                  <div className="text-xs text-neutral-400">setup</div>
                  <div className="text-lg font-bold text-neutral-900 mt-1">{formatCAD(98.50)}</div>
                  <div className="text-xs text-neutral-400">/month</div>
                </div>
              </div>
              <ul className="space-y-1.5 mb-5">
                {[
                  "Up to 100 Derivative Accounts",
                  "SPLITS enabled",
                  "Market ownership",
                  "FAST Code generation",
                  "Claim A Market™ eligibility",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-neutral-600">
                    <Check className="w-3.5 h-3.5 text-neutral-900 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/talispros/register"
                className="inline-flex h-11 w-full rounded-xl bg-neutral-900 text-white text-sm font-medium tracking-wide items-center justify-center hover:bg-neutral-800 active:scale-[0.98] transition-all"
              >
                Register Root Account™
              </Link>
            </div>
          </section>

          {/* Derivative Account™ */}
          <section className="mb-12">
            <div className="rounded-2xl border-2 border-neutral-200 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">Derivative Account™</h2>
                  <p className="text-sm text-neutral-500 mt-1">Multi-PIN account under a Root Account™.</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-neutral-900">{formatCAD(198.50)}</div>
                  <div className="text-xs text-neutral-400">setup</div>
                  <div className="text-lg font-bold text-neutral-900 mt-1">{formatCAD(19.50)}</div>
                  <div className="text-xs text-neutral-400">/month</div>
                </div>
              </div>
              <ul className="space-y-1.5 mb-5">
                {[
                  "Multi-PIN support",
                  "FAST Code generation",
                  "Operates under Root Account™",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-neutral-600">
                    <Check className="w-3.5 h-3.5 text-neutral-900 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/talispros/register"
                className="inline-flex h-11 w-full rounded-xl bg-neutral-900 text-white text-sm font-medium tracking-wide items-center justify-center hover:bg-neutral-800 active:scale-[0.98] transition-all"
              >
                Register Derivative Account™
              </Link>
            </div>
          </section>

          {/* AdPro™ Section */}
          <section className="mb-12">
            <div className="rounded-2xl border-2 border-neutral-200 p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-1">AdPro™ Account</h2>
              <p className="text-sm text-neutral-500 mb-5">Individual and multi-PIN packages. No SPLITS.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {ADPRE_PACKAGES.map((pkg) => (
                  <div key={pkg.label} className="bg-neutral-50 rounded-xl border border-neutral-200 p-4">
                    <div className="text-sm font-medium text-neutral-900">{pkg.label}</div>
                    <div className="text-lg font-bold text-neutral-900 mt-1">{formatCAD(pkg.price)}</div>
                    <div className="text-xs text-neutral-400">/month</div>
                  </div>
                ))}
              </div>
              <Link
                href="/talispros/register"
                className="inline-flex h-11 w-full rounded-xl bg-neutral-900 text-white text-sm font-medium tracking-wide items-center justify-center hover:bg-neutral-800 active:scale-[0.98] transition-all"
              >
                Choose AdPro™ Package
              </Link>
            </div>
          </section>

          <hr className="border-t border-neutral-200 mb-12" />

          {/* Service Floors */}
          <section className="mb-12">
            <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-6 sm:p-8">
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
                  These recommendations support:
                </p>
                <ul className="list-disc list-inside space-y-1 text-neutral-500">
                  <li>Fractional ownership opportunities</li>
                  <li>Development projects</li>
                  <li>Referral ecosystems</li>
                  <li>Marketplace integrity</li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-t border-neutral-200 mb-12" />

          {/* Final CTA */}
          <section className="text-center">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 mb-6">
              Ready To Claim Your Market™?
            </h2>
            <Link
              href="/talispros/register"
              className="inline-flex h-12 px-10 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wide items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all"
            >
              Proceed To Registration
            </Link>
          </section>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-[30%] bg-[#e2e5ea] lg:border-l border-[#e5e5e5] p-8 lg:sticky lg:top-0 lg:self-start lg:max-h-screen lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="space-y-6">
          {/* Card 1 — Pre-Selections */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-red-400 text-center">
            <p className="text-sm text-neutral-900 leading-relaxed mb-1">
              Text +1-888-585-1273 to make your pre-selections.
            </p>
            <p className="text-xs text-neutral-500 leading-relaxed mb-4">
              Onboarding typically occurs within two business days thereafter.
            </p>
            <Link
              href="/talispros/build-mapsite"
              className="group inline-flex h-10 px-6 bg-neutral-900 text-white rounded-lg text-sm font-medium tracking-wide items-center justify-center gap-1.5 hover:bg-neutral-800 active:scale-[0.98] transition-all"
            >
              <span className="group-hover:underline">Explore further</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <FastCodeSidebarCard />

          {/* Card 3 — Account Types */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-base font-semibold text-neutral-900 mb-3">Account Types</h3>
            <ul className="space-y-2 mb-5">
              <li className="flex items-center gap-2 text-sm text-neutral-600">
                <Check className="w-4 h-4 text-neutral-900 flex-shrink-0" />
                Root Account™
              </li>
              <li className="flex items-center gap-2 text-sm text-neutral-600">
                <Check className="w-4 h-4 text-neutral-900 flex-shrink-0" />
                Derivative Account™
              </li>
              <li className="flex items-center gap-2 text-sm text-neutral-600">
                <Check className="w-4 h-4 text-neutral-900 flex-shrink-0" />
                AdPro™
              </li>
            </ul>
            <Link
              href="/talispros/register"
              className="flex h-10 w-full rounded-lg bg-neutral-900 text-white text-sm font-medium items-center justify-center hover:bg-neutral-800 active:scale-[0.98] transition-all"
            >
              Register Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
