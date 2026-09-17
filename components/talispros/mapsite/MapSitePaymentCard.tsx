"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import type { RegistrationMarket } from "@/lib/registration-market";
import type { PlanType } from "@/lib/registration-plans";
import { mapsiteClaimPlanSummary } from "@/lib/talispros/mapsite-audience";
import { MAPSITE_LISTING_CARD_WIDTH_CLASS } from "@/lib/talispros/mapsite-listing-media";
import { createMapSiteStripeCheckoutSession } from "@/app/talispros/mapsite/actions";

interface MapSitePaymentCardProps {
  audience: RegistrationMarket;
  mapsiteId: string;
  fastCode?: string | null;
  requestId?: string | null;
  /** Plan chosen on Claim a Market (defaults to full Root). Display only. */
  planType?: PlanType;
  /** Phone-only compact card so the map pin remains visible. */
  compact?: boolean;
  checkoutStatus?: "success" | "cancelled" | null;
}

const PHONE_QUERY = "(max-width: 639px)";

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
  checkoutStatus = null,
}: MapSitePaymentCardProps) {
  const summary = mapsiteClaimPlanSummary(planType);
  const compact = useMediaQuery(PHONE_QUERY) || compactProp;

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleActivate() {
    setProcessing(true);
    setError(null);
    const result = await createMapSiteStripeCheckoutSession({
      mapsiteId,
      requestId,
      audience,
      fastCode,
    });
    if (result.url) {
      window.location.assign(result.url);
      return;
    }
    setError(result.error || "Unable to start checkout. Please try again.");
    setProcessing(false);
  }

  const pendingConfirmation = checkoutStatus === "success";
  const cancelled = checkoutStatus === "cancelled";
  const totalDue = summary.totalLabel.replace(/\s*\(incl\. tax\)/i, "");

  return (
    <div
      className={`mapsite-pay-card pointer-events-auto ${MAPSITE_LISTING_CARD_WIDTH_CLASS} rounded-[22px] bg-white/80 shadow-[0_8px_28px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04] backdrop-blur-xl ${
        compact ? "px-3.5 py-3" : "px-5 py-4"
      }`}
    >
      <p className="text-[11px] font-medium tracking-[0.01em] text-neutral-400">
        {compact ? summary.planLabel : "Complete registration"}
      </p>

      {compact ? (
        <p className="mt-0.5 text-[15px] font-semibold tracking-tight text-neutral-900">
          {totalDue}
        </p>
      ) : (
        <>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <h3 className="m-0 truncate text-[15px] font-semibold tracking-tight text-neutral-900">
              {summary.planLabel}
            </h3>
            <p className="m-0 shrink-0 text-[15px] font-semibold tracking-tight text-neutral-900">
              {totalDue}
            </p>
          </div>
          <p className="mt-1 text-[12px] leading-snug text-neutral-500">
            {summary.priceLabel} + {summary.taxLabel}
          </p>
        </>
      )}

      {pendingConfirmation ? (
        <p className="mt-3 text-[13px] leading-snug text-neutral-500">
          Payment submitted. Activating your Mapsite™…
        </p>
      ) : null}
      {cancelled && !processing ? (
        <p className="mt-3 text-[13px] leading-snug text-neutral-500">
          Checkout was cancelled. You can activate when you are ready.
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-[13px] leading-snug text-red-600">{error}</p>
      ) : null}

      <button
        type="button"
        onClick={handleActivate}
        disabled={processing || pendingConfirmation}
        className={`flex w-full items-center justify-center rounded-full bg-neutral-900 text-[15px] font-medium text-white transition hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-50 ${
          compact ? "mt-3 min-h-9 px-4 text-[13px]" : "mt-4 min-h-11 px-5"
        }`}
      >
        {pendingConfirmation
          ? "Confirming payment…"
          : processing
            ? "Redirecting…"
            : "Activate"}
      </button>
    </div>
  );
}
