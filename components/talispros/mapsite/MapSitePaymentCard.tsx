"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import type { RegistrationMarket } from "@/lib/registration-market";
import type { PlanType } from "@/lib/registration-plans";
import { mapsiteClaimPlanSummary } from "@/lib/talispros/mapsite-audience";
import { MAPSITE_LISTING_CARD_WIDTH_CLASS } from "@/lib/talispros/mapsite-listing-media";
import { shouldRegisterAgentsAfterPayment } from "@/lib/talispros/register-agents";
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

  return (
    <div
      className={`mapsite-pay-card pointer-events-auto ${MAPSITE_LISTING_CARD_WIDTH_CLASS} rounded-2xl bg-white/75 shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/5 backdrop-blur-sm ${
        compact ? "px-3 py-2" : "p-4"
      }`}
    >
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleActivate}
          disabled={processing || pendingConfirmation}
          className="inline-flex min-h-8 items-center justify-center rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-70"
        >
          {pendingConfirmation
            ? "Confirming payment…"
            : processing
              ? "Redirecting to checkout…"
              : "Activate Your MapSite™"}
        </button>
      </div>

      <div className={compact ? "mt-2" : "mt-3"}>
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
      </div>

      {pendingConfirmation ? (
        <p className="mt-2 text-center text-xs text-neutral-600">
          Payment submitted. Activating your Mapsite™…
        </p>
      ) : null}
      {cancelled && !processing ? (
        <p className="mt-2 text-center text-xs text-neutral-600">
          Checkout was cancelled. You can activate when you are ready.
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-center text-xs text-red-600">{error}</p>
      ) : null}

      {!compact && !pendingConfirmation ? (
        <p className="mt-2 text-[11px] leading-snug text-neutral-500">
          Checkout charges {summary.totalLabel}. After payment{" "}
          {shouldRegisterAgentsAfterPayment({ audience })
            ? "you'll continue to Register Your Agents."
            : "this Mapsite™ becomes active."}
        </p>
      ) : null}
    </div>
  );
}
