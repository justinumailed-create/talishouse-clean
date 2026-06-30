"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import FastCodeSidebarCard from "@/components/talispros/FastCodeSidebarCard";
import RootAccountRegistrationForm from "@/components/talispros/RootAccountRegistrationForm";
import {
  OFFERED_SUBSCRIPTION_TIER_LABELS,
  parseOfferedSubscriptionTier,
} from "@/lib/mapsite-subscription";

function RegisterSidebar() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-[#c92026] text-center">
        <p className="text-sm text-neutral-900 leading-relaxed mb-4">
          After registration, you will continue to Build A MapSite™ to submit
          your production request.
        </p>
        <Link
          href="/talispros/build-mapsite"
          className="inline-flex h-10 px-6 bg-neutral-900 text-white rounded-lg text-sm font-medium tracking-wide items-center justify-center hover:bg-neutral-800 active:scale-[0.98] transition-all"
        >
          Build A MapSite™
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: "500px" }}>
        <iframe
          src="/partner-access"
          width="100%"
          height="100%"
          frameBorder="0"
          title="Partner Access"
        />
      </div>

      <FastCodeSidebarCard />
    </div>
  );
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const plan = parseOfferedSubscriptionTier(searchParams.get("plan"));
  const parentFastCode = searchParams.get("parentFastCode") || undefined;
  const planLabel = OFFERED_SUBSCRIPTION_TIER_LABELS[plan];

  return (
    <div className="flex flex-col h-screen lg:h-screen bg-white font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
        <div className="w-full lg:w-[70%] lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-2xl mx-auto px-5 py-8 sm:py-12 lg:py-16">
            <div className="text-center mb-8 sm:mb-10">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-neutral-900">
                Register {planLabel}
              </h1>
              <p className="text-sm sm:text-base text-neutral-500 mt-2">
                Complete payment to activate your account, then continue to Build
                A MapSite™.
              </p>
            </div>

            <RootAccountRegistrationForm
              variant="page"
              allowedTier={plan}
              parentFastCode={parentFastCode}
            />

            <div className="mt-8 bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
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
                  These recommendations support future
                  fractional ownership opportunities, development
                  projects, referral ecosystems, and marketplace integrity.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[30%] bg-[#e2e5ea] lg:border-l border-[#e5e5e5] p-8 lg:sticky lg:top-0 lg:self-start lg:max-h-screen lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <RegisterSidebar />
        </div>
      </div>
    </div>
  );
}

export default function TalisprosRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
