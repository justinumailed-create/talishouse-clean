"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useSyncExternalStore } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import type { RegistrationMarket } from "@/lib/registration-market";
import type { PlanType } from "@/lib/registration-plans";
import { mapsiteClaimPlanSummary } from "@/lib/talispros/mapsite-audience";
import { MAPSITE_LISTING_CARD_WIDTH_CLASS } from "@/lib/talispros/mapsite-listing-media";
import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";
import { processMapSiteRootPaypalPayment } from "@/app/talispros/mapsite/actions";

interface MapSitePaymentCardProps {
  audience: RegistrationMarket;
  mapsiteId: string;
  fastCode?: string | null;
  requestId?: string | null;
  /** Plan chosen on Claim a Market (defaults to full Root). */
  planType?: PlanType;
  /** Phone-only compact card so the map pin remains visible. */
  compact?: boolean;
}

const PHONE_QUERY = "(max-width: 639px)";
/** Short phones can't spare the vertical PayPal stack without covering the pin. */
const SHORT_PHONE_QUERY = "(max-width: 639px) and (max-height: 700px)";

/** Compact layout must not depend on parent measurement timing. */
function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export default function MapSitePaymentCard({
  audience,
  mapsiteId,
  fastCode,
  requestId,
  planType = "ROOT_ACCOUNT",
  compact: compactProp = false,
}: MapSitePaymentCardProps) {
  const router = useRouter();
  const summary = mapsiteClaimPlanSummary(planType);
  const shortPhone = useMediaQuery(SHORT_PHONE_QUERY);
  const compact = useMediaQuery(PHONE_QUERY) || compactProp;
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() || "";

  const [paypalKey, setPaypalKey] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      planType: summary.planType,
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
      className={`mapsite-pay-card pointer-events-auto ${MAPSITE_LISTING_CARD_WIDTH_CLASS} rounded-2xl bg-white/75 shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/5 backdrop-blur-sm ${
        compact ? "px-3 py-2" : "p-4"
      }`}
    >
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setDrawerOpen((open) => !open)}
          aria-expanded={drawerOpen}
          className="inline-flex min-h-8 items-center justify-center rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800"
        >
          Register Account now
        </button>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          drawerOpen ? "mt-3 max-h-[700px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className={compact ? "flex items-baseline justify-between gap-3" : ""}>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {compact ? summary.planLabel : "Complete registration"}
          </p>
          {compact ? (
            <span className="shrink-0 text-sm font-semibold text-black">
              {summary.totalLabel}
            </span>
          ) : null}
        </div>
        <h3
          className={`items-baseline justify-between gap-3 text-base font-semibold text-black ${
            compact ? "hidden" : "mt-1 flex"
          }`}
        >
          <span>{summary.planLabel}</span>
          <span className="shrink-0 text-sm font-semibold">{summary.priceLabel}</span>
        </h3>
        <p className={compact ? "hidden" : "mt-1 text-xs text-neutral-600"}>
          {summary.priceLabel} + {summary.taxLabel} = {summary.totalLabel}
        </p>

        {!clientId ? (
          <p className="mt-3 text-sm text-red-600">
            PayPal is not configured. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID.
          </p>
        ) : (
          <div className={compact ? "mt-2" : "mt-3"}>
            <PayPalScriptProvider
              options={{
                clientId,
                currency: "CAD",
                intent: "capture",
              }}
            >
              <PayPalButtons
                key={`${paypalKey}-${compact ? "compact" : "full"}-${
                  shortPhone ? "short" : "tall"
                }`}
                disabled={processing}
                style={{
                  layout: shortPhone ? "horizontal" : "vertical",
                  color: "blue",
                  shape: "rect",
                  label: "pay",
                  height: compact ? 36 : 42,
                  ...(shortPhone ? { tagline: false } : {}),
                }}
                createOrder={async (_data, actions) =>
                  actions.order.create({
                    intent: "CAPTURE",
                    purchase_units: [
                      {
                        description: `Talispros™ ${summary.planLabel} — MapSite ${fastCode || mapsiteId}`,
                        amount: {
                          currency_code: "CAD",
                          value: summary.total.toFixed(2),
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

        {!compact ? (
          <p className="mt-2 text-[11px] leading-snug text-neutral-500">
            PayPal charges {summary.totalLabel}. After payment, Express an Interest
            unlocks and this MapSite™ becomes active for admin management on{" "}
            {MAPSITE_APP_PATH}.
          </p>
        ) : null}
      </div>
    </div>
  );
}
