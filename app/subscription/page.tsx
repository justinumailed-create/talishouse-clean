"use client";

import { useState } from "react";
import Link from "next/link";
import SubscriptionDrawer from "@/components/SubscriptionDrawer";

export default function SubscriptionPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<"referral" | "wholesale">("referral");

  const openDrawer = (type: "referral" | "wholesale") => {
    setDrawerType(type);
    setDrawerOpen(true);
  };

  return (
    <div className="container py-12">
      <div className="w-full">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tighter uppercase text-gray-900">
            Partner Programs
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Join our network of partners and grow with Talishouse™
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] flex flex-col">
            <div className="flex items-center justify-between bg-gray-900 px-6 py-5 text-white">
              <p className="text-sm font-bold uppercase tracking-[0.25em]">
                Referral Partner
              </p>
            </div>

            <div className="flex-1 space-y-6 p-6 sm:p-8">
              <div className="mb-2">
                <div className="text-2xl font-semibold text-black">
                  $95.00
                </div>
                <div className="text-xs text-gray-500">
                  per month
                </div>
              </div>

              <div className="space-y-4 text-gray-600">
                <p>
                  Subscribe as a Referral Partner to start earning commissions on
                  referred projects.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6">
                  Benefits:
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Commission-based referral fees</li>
                  <li>Access to exclusive project leads</li>
                  <li>Marketing materials and support</li>
                  <li>Real-time referral tracking dashboard</li>
                  <li>Priority support from our team</li>
                </ul>
              </div>
            </div>

            <div className="p-6 sm:p-8 pt-0">
              <button
                onClick={() => openDrawer("referral")}
                className="w-full bg-black text-white rounded-2xl py-4 text-xs font-bold uppercase tracking-[0.28em] hover:bg-gray-900 transition-colors text-center block"
              >
                View Details
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                Cancel anytime. Commission rates vary by project type.
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] flex flex-col">
            <div className="flex items-center justify-between bg-gray-900 px-6 py-5 text-white">
              <p className="text-sm font-bold uppercase tracking-[0.25em]">
                Wholesale Partner
              </p>
            </div>

            <div className="flex-1 space-y-6 p-6 sm:p-8">
              <div className="mb-2">
                <div className="text-2xl font-semibold text-black">
                  $1,995.00
                </div>
                <div className="text-xs text-gray-500">
                  One-time registration fee
                </div>
              </div>

              <div className="mt-2">
                <div className="text-sm text-black">
                  Then, starting in 1 month, $95.00/mo
                </div>
              </div>

              <div className="space-y-4 text-gray-600">
                <p>
                  Register as a Wholesale Partner for bulk pricing and volume
                  discounts on Talishouse™ products.
                </p>

                <h3 className="font-semibold text-gray-900 mt-6">
                  Benefits:
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Wholesale pricing on all units</li>
                  <li>Volume discounts and tiered pricing</li>
                  <li>Priority manufacturing scheduling</li>
                  <li>Dedicated account manager</li>
                  <li>Early access to new product lines</li>
                </ul>
              </div>
            </div>

            <div className="p-6 sm:p-8 pt-0">
              <button
                onClick={() => openDrawer("wholesale")}
                className="w-full bg-black text-white rounded-2xl py-4 text-xs font-bold uppercase tracking-[0.28em] hover:bg-gray-900 transition-colors text-center block"
              >
                View Details
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                Volume pricing available. Contact us for enterprise deals.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/lease-to-own"
            className="text-sm text-gray-600 hover:text-black underline"
          >
            Looking for financing? Learn about Lease-to-Own →
          </Link>
        </div>
      </div>

      <SubscriptionDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        type={drawerType}
      />
    </div>
  );
}
