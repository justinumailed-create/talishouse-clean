"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCAD } from "@/utils/currency";
import { isAuthorized } from "@/lib/fast-code";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb";

export default function SubscriptionPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [buttonsRendered, setButtonsRendered] = useState(false);

  useEffect(() => {
    setAuthorized(isAuthorized());
  }, []);

  useEffect(() => {
    if (authorized === false) {
      window.location.href = "/business-office";
    }
  }, [authorized]);

  useEffect(() => {
    if (!document.getElementById("paypal-sdk")) {
      const script = document.createElement("script");
      script.id = "paypal-sdk";
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;
      script.async = true;
      script.onload = () => setButtonsRendered(true);
      document.body.appendChild(script);
    } else if (window.paypal) {
      setButtonsRendered(true);
    }
  }, []);

  useEffect(() => {
    if (buttonsRendered && (window.paypal as any)) {
      (window.paypal as any)
        .Buttons({
          style: {
            layout: "horizontal",
            shape: "pill",
            color: "black",
            label: "subscribe",
          },
          createSubscription: function (_data: any, actions: any) {
            return actions.subscription.create({
              plan_id: "P-REFERRAL-95",
            });
          },
          onApprove: function (data: any) {
            console.log("Referral Subscription ID:", data.subscriptionID);
          },
        })
        .render("#paypal-referral-button");

      (window.paypal as any)
        .Buttons({
          style: {
            layout: "horizontal",
            shape: "pill",
            color: "black",
            label: "subscribe",
          },
          createSubscription: function (_data: any, actions: any) {
            return actions.subscription.create({
              plan_id: "P-WHOLESALE-95",
            });
          },
          onApprove: function (data: any) {
            console.log("Wholesale Subscription ID:", data.subscriptionID);
          },
        })
        .render("#paypal-wholesale-button");
    }
  }, [buttonsRendered]);

  if (authorized === null) {
    return null;
  }

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
                  {formatCAD(95)}
                </div>
                <div className="text-xs text-gray-500">
                  per month
                </div>
              </div>

              <div className="text-sm text-black">
                Maintain access at {formatCAD(95)}/mo
              </div>

              <div className="space-y-4 text-gray-600">
                <p>
                  Subscribe as a Referral Partner to start earning commissions on
                  referred projects.
                </p>

                <div className="text-sm text-gray-500 mb-2">
                  For Referral partners
                </div>

                <h3 className="font-semibold text-gray-900 mt-6">
                  Benefits:
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Upto 10% of MSRP</li>
                  <li>Exclusive project leads</li>
                  <li>Marketing materials and support</li>
                  <li>Real-time referral tracking dashboard</li>
                  <li>Same day support from our team</li>
                </ul>
              </div>
            </div>

            <div className="p-6 sm:p-8 pt-0">
              <div className="mt-4 mb-2">
                <div
                  id="paypal-referral-button"
                  className="w-full h-[48px]"
                ></div>
              </div>
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
                  {formatCAD(1995)}
                </div>
                <div className="text-xs text-gray-500">
                  One-time registration fee
                </div>
              </div>

              <div className="mt-2">
                <div className="text-sm text-black">
                  Maintain access at {formatCAD(95)}/mo
                </div>
              </div>

              <div className="space-y-4 text-gray-600">
                <p>
                  Register as a Wholesale Partner for bulk pricing and volume
                  discounts on Talishouse™ products.
                </p>

                <div className="text-sm text-gray-500 mb-2">
                  For Resale and fulfilment partners
                </div>

                <h3 className="font-semibold text-gray-900 mt-6">
                  Benefits:
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Wholesale pricing</li>
                  <li>Your own dedicated Mapsite™</li>
                  <li>Priority production & delivery scheduling</li>
                  <li>Dedicated account manager</li>
                  <li>Early access to new product lines</li>
                </ul>
              </div>
            </div>

            <div className="p-6 sm:p-8 pt-0">
              <div className="mt-4 mb-2">
                <div
                  id="paypal-wholesale-button"
                  className="w-full h-[48px]"
                ></div>
              </div>
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
    </div>
  );
}
