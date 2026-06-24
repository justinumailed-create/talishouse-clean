"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const PRODUCTS = [
  {
    title: "TalisMaps™",
    description:
      "Industry-adjacent marketplaces that connect real estate professionals with buyers, sellers, and referral partners.",
  },
  {
    title: "TalisForms™",
    description:
      "Enterprise-grade forms infrastructure for real estate documentation, agreements, and compliance workflows.",
  },
  {
    title: "FAST Codes™",
    description:
      "Universal gateway codes that route accounts, authenticate access, and unify the TalisPros™ ecosystem.",
  },
];

export default function TalisprosStartPage() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-5 pt-20 sm:pt-28 pb-20 sm:pb-28">
        {/* Hero */}
        <section
          className={`text-center transition-all duration-700 ease-out ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="TalisPros™"
              width={56}
              height={56}
              className="w-14 h-14 object-contain"
              priority
            />
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-neutral-900 mb-3">
            TalisPros™ PMC
          </h1>
          <p className="text-base sm:text-lg text-neutral-500 mb-4">
            Industry Adjacent Marketplaces{" "}
            <span className="hidden sm:inline"><br /></span>
            For Real Estate Professionals
          </p>

          {/* Subheadline */}
          <p className="text-sm sm:text-base text-neutral-400 max-w-xl mx-auto leading-relaxed mb-8">
            Claim markets. Generate FAST Codes™. Launch MapSites™. Build referral ecosystems.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/talispros/claim-a-market"
              className="inline-flex h-12 px-8 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wide items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all"
            >
              Claim A Market™
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/talispros/register"
              className="inline-flex h-12 px-8 border border-neutral-300 text-neutral-700 rounded-xl text-sm font-medium tracking-wide items-center justify-center hover:bg-neutral-50 active:scale-[0.98] transition-all"
            >
              Register Account
            </Link>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-t border-neutral-200 my-20 sm:my-24" />

        {/* Product Cards */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {PRODUCTS.map((product) => (
              <div
                key={product.title}
                className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200"
              >
                <h3 className="text-sm font-semibold text-neutral-900 mb-1.5">
                  {product.title}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {product.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
