import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import FastCodeSidebarCard from "@/components/talispros/FastCodeSidebarCard";

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
        <div className="w-full lg:w-[30%] bg-[#e2e5ea] lg:border-l border-[#e5e5e5] p-8 lg:sticky lg:top-0 lg:self-start lg:max-h-screen lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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

            <FastCodeSidebarCard />
          </div>
        </div>
      </div>
    </div>
  );
}
