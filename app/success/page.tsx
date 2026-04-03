"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get("subscription_id");

  return (
    <div className="min-h-[70vh] bg-white py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tighter uppercase text-gray-900">
            Subscription Successful
          </h1>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
          <div className="flex items-center justify-between bg-gray-900 px-6 py-5 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.25em]">
              Welcome
            </p>
          </div>

          <div className="space-y-6 p-6 sm:p-8 text-center">
            <div className="text-6xl">✓</div>
            
            <h2 className="text-xl font-bold text-gray-900">
              Thank you for subscribing!
            </h2>

            <div className="space-y-2 text-gray-600">
              <p>
                Your referral partner subscription is now active.
              </p>
              {subscriptionId && (
                <p className="text-xs text-gray-400">
                  Subscription ID: {subscriptionId}
                </p>
              )}
            </div>

            <Link
              href="/subscription"
              className="w-full bg-black text-white rounded-2xl py-4 text-xs font-bold uppercase tracking-[0.28em] hover:bg-gray-900 transition-colors text-center block"
            >
              Complete Your Profile
            </Link>

            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-black underline block"
            >
              Return to Homepage
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] bg-white py-12 text-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}