"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import type { RegistrationMarket } from "@/lib/registration-market";
import { PLAN_DETAILS, registrationTotalFor } from "@/lib/registration-plans";
import { rootAccountPlanSummary } from "@/lib/talispros/mapsite-audience";
import { MAPSITE_LISTING_CARD_WIDTH_CLASS } from "@/lib/talispros/mapsite-listing-media";
import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";
import { processMapSiteRootPaypalPayment } from "@/app/talispros/mapsite/actions";

interface MapSitePaymentCardProps {
  audience: RegistrationMarket;
  mapsiteId: string;
  fastCode?: string | null;
  requestId?: string | null;
}

export default function MapSitePaymentCard({
  audience,
  mapsiteId,
  fastCode,
  requestId,
}: MapSitePaymentCardProps) {
  const router = useRouter();
  const summary = rootAccountPlanSummary();
  const rootPrice = PLAN_DETAILS.ROOT_ACCOUNT.price;
  const total = registrationTotalFor(rootPrice);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() || "";

  const [paypalKey, setPaypalKey] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove(details: {
    id: string;
    captureId?: string;
  }) {
    setProcessing(true);
    setError(null);

    const result = await processMapSiteRootPaypalPayment({
      mapsiteId,
      requestId,
      audience,
      paypalOrderId: details.id,
      paypalCaptureId: details.captureId || details.id,
    });

    if (result.success && result.redirectUrl) {
      router.push(result.redirectUrl);
      return;
    }

    setError(result.error || "Payment processing failed. Please try again.");
    setProcessing(false);
    setPaypalKey((key) => key + 1);
  }

  return (
    <div
      className={`pointer-events-auto ${MAPSITE_LISTING_CARD_WIDTH_CLASS} rounded-2xl bg-white/75 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/5 backdrop-blur-sm`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        Complete registration
      </p>
      <h3 className="mt-1 flex items-baseline justify-between gap-3 text-base font-semibold text-black">
        <span>Root Account™</span>
        <span className="shrink-0 text-sm font-semibold">{summary.priceLabel}</span>
      </h3>

      {!clientId ? (
        <p className="mt-3 text-sm text-red-600">
          PayPal is not configured. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID.
        </p>
      ) : (
        <div className="mt-3">
          <PayPalScriptProvider
            options={{
              clientId,
              currency: "CAD",
              intent: "capture",
            }}
          >
            <PayPalButtons
              key={paypalKey}
              disabled={processing}
              style={{
                layout: "vertical",
                color: "blue",
                shape: "rect",
                label: "pay",
                height: 42,
              }}
              createOrder={async (_data, actions) =>
                actions.order.create({
                  intent: "CAPTURE",
                  purchase_units: [
                    {
                      description: `Talispros™ Root Account™ — MapSite ${fastCode || mapsiteId}`,
                      amount: {
                        currency_code: "CAD",
                        value: total.toFixed(2),
                      },
                    },
                  ],
                })
              }
              onApprove={async (_data, actions) => {
                if (!actions.order) return;
                const details = await actions.order.capture();
                await handleApprove({
                  id: details.id || "",
                  captureId:
                    details.purchase_units?.[0]?.payments?.captures?.[0]?.id,
                });
              }}
              onError={() => {
                setError("Payment failed. Please try again.");
                setPaypalKey((key) => key + 1);
              }}
              onCancel={() => {
                setProcessing(false);
              }}
            />
          </PayPalScriptProvider>
        </div>
      )}

      {processing ? (
        <p className="mt-2 text-center text-xs text-neutral-600">
          Processing payment…
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-center text-xs text-red-600">{error}</p>
      ) : null}

      <p className="mt-2 text-[11px] leading-snug text-neutral-500">
        PayPal charges {summary.totalLabel}. After payment you&apos;ll return to{" "}
        {MAPSITE_APP_PATH} with Express Interest unlocked.
      </p>
    </div>
  );
}
