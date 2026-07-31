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
  onSelectListing: () => void;
  /** Partner / FAST card content (claimed). */
  aboveCard?: ReactNode;
  /** Payment CTA or Express Interest. */
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
  onSelectListing,
  aboveCard,
  belowCard,
}: MapSiteListingSidebarProps) {
  const claimed = !isClaimable(mapsite.status);

  return (
    <aside
      className={
        compact
          ? `pointer-events-none relative z-20 mx-auto flex h-full min-h-0 max-h-full w-full ${MAPSITE_LISTING_CARD_WIDTH_CLASS} flex-col overflow-hidden`
          : `pointer-events-none absolute bottom-3 left-3 top-3 z-20 flex min-h-0 w-[min(92vw,22rem)] flex-col overflow-hidden sm:left-4 sm:top-4 sm:bottom-4`
      }
    >
      <div
        className="pointer-events-auto flex h-full min-h-0 max-h-full flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain touch-pan-y pr-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onWheel={stopMapScrollSteal}
      >
        <div className="flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-white/50 px-3 py-2 shadow-md ring-1 ring-black/5 backdrop-blur-sm">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0 text-neutral-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            placeholder="Search..."
            className="w-full bg-transparent text-base text-neutral-700 outline-none placeholder:text-neutral-400 sm:text-sm"
            aria-label="Search MapSite"
          />
        </div>

        {claimed ? (
          aboveCard
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

        {belowCard ? <div className="shrink-0 pb-1">{belowCard}</div> : null}
      </div>
    </aside>
  );
}
