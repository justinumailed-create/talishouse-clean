"use client";

import type { ReactNode, RefObject, WheelEvent } from "react";
import type { MapSitePlatformRecord } from "@/lib/talispros/mapsite-platform";
import { MAPSITE_LISTING_CARD_WIDTH_CLASS } from "@/lib/talispros/mapsite-listing-media";
import { isClaimable } from "@/lib/talispros/mapsite-state";

interface MapSiteListingSidebarProps {
  mapsite: MapSitePlatformRecord;
  listingCardRef?: RefObject<HTMLDivElement | null>;
  /** Narrow viewports: full-width stacked overlay instead of left float. */
  compact?: boolean;
  /** Phone layout: stacked overlay instead of a left float. */
  mobileOverlay?: boolean;
  onSelectListing: () => void;
  /** Partner / FAST marketing sidebar (claimed). */
  aboveCard?: ReactNode;
  /** Payment CTA — rendered above the marketing sidebar on unpaid claimed Mapsites™. */
  belowCard?: ReactNode;
}

function stopMapScrollSteal(event: WheelEvent<HTMLDivElement>) {
  // Keep wheel/trackpad gestures on the sidebar; don't let the map zoom.
  event.stopPropagation();
}

export default function MapSiteListingSidebar({
  mapsite,
  listingCardRef,
  compact = false,
  mobileOverlay = false,
  onSelectListing,
  aboveCard,
  belowCard,
}: MapSiteListingSidebarProps) {
  const claimed = !isClaimable(mapsite.status);

  return (
    <aside
      className={
        mobileOverlay
          ? `pointer-events-none relative z-20 mx-auto flex h-full min-h-0 w-full ${MAPSITE_LISTING_CARD_WIDTH_CLASS} flex-col`
          : compact
          ? `pointer-events-none relative z-20 mx-auto flex h-full min-h-0 max-h-full w-full ${MAPSITE_LISTING_CARD_WIDTH_CLASS} flex-col overflow-hidden`
          : `pointer-events-none absolute bottom-3 left-3 top-3 z-20 flex min-h-0 w-[min(92vw,22rem)] flex-col overflow-hidden sm:left-4 sm:top-4 sm:bottom-4`
      }
    >
      <div
        className={
          mobileOverlay
            ? "pointer-events-none flex h-full min-h-0 flex-1 flex-col gap-3"
            : "pointer-events-auto flex h-full min-h-0 max-h-full flex-1 flex-col gap-3 overflow-hidden pr-0.5"
        }
      >
        <div
          className={
            mobileOverlay
              ? "pointer-events-none flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain"
              : "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain"
          }
          onWheel={stopMapScrollSteal}
        >
        {belowCard ? (
          <div
            className={
              mobileOverlay
                ? "pointer-events-auto shrink-0 translate-x-1"
                : "shrink-0"
            }
          >
            {belowCard}
          </div>
        ) : null}

        {claimed ? (
          <div
            className={
              mobileOverlay
                ? "pointer-events-auto w-full shrink-0 translate-x-1"
                : undefined
            }
          >
            {aboveCard}
          </div>
        ) : (
          <div ref={listingCardRef} className="w-full shrink-0">
            <button
              type="button"
              onClick={onSelectListing}
              className="w-full rounded-2xl bg-white/80 px-4 py-3.5 text-left shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/5 backdrop-blur-sm transition hover:bg-white/90"
            >
              <p className="text-sm font-semibold tracking-tight text-black">
                Unclaimed Market
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-neutral-700">
                Welcome to Talispros™. Choose your market and begin onboarding.
              </p>
            </button>
          </div>
        )}
        </div>
      </div>
    </aside>
  );
}
