"use client";

import type { ReactNode, RefObject } from "react";
import Image from "next/image";
import {
  MAPSITE_DEMO_SIDEBAR_BLURB,
  type MapSitePlatformRecord,
} from "@/lib/talispros/mapsite-platform";
import {
  getMapSiteListingHeroImage,
  MAPSITE_LISTING_CARD_WIDTH_CLASS,
  MAPSITE_LISTING_HERO_HEIGHT_CLASS,
  MAPSITE_LISTING_IMAGE_CLASS,
} from "@/lib/talispros/mapsite-listing-media";
import { isClaimable, showsResourceActions } from "@/lib/talispros/mapsite-state";

interface MapSiteListingSidebarProps {
  mapsite: MapSitePlatformRecord;
  listingCardRef?: RefObject<HTMLDivElement | null>;
  cardHeight?: number | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSelectListing: () => void;
  /** Payment CTA or Express Interest — rendered under the FAST card. */
  belowCard?: ReactNode;
}

export default function MapSiteListingSidebar({
  mapsite,
  listingCardRef,
  cardHeight,
  collapsed,
  onToggleCollapsed,
  onSelectListing,
  belowCard,
}: MapSiteListingSidebarProps) {
  const claimed = !isClaimable(mapsite.status);
  const showFastCode = claimed && Boolean(mapsite.fast_code);
  const heroImage = getMapSiteListingHeroImage(mapsite);
  const title = showFastCode
    ? `FAST Code: ${mapsite.fast_code}`
    : claimed
      ? "Claim received"
      : "Unclaimed Market";

  return (
    <aside
      className={`pointer-events-none absolute left-3 top-3 z-20 flex ${MAPSITE_LISTING_CARD_WIDTH_CLASS} flex-col gap-3 sm:left-4 sm:top-4`}
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/50 px-3 py-2 shadow-md ring-1 ring-black/5 backdrop-blur-sm">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 text-neutral-500"
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
          className="w-full bg-transparent text-sm text-neutral-700 outline-none placeholder:text-neutral-400"
          aria-label="Search MapSite"
        />
      </div>

      <div
        ref={listingCardRef}
        className="pointer-events-auto flex flex-col overflow-hidden rounded-2xl bg-white/75 text-left shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/5 backdrop-blur-sm"
        style={cardHeight ? { height: cardHeight } : undefined}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-neutral-200/70 px-3 py-2">
          <button
            type="button"
            onClick={onSelectListing}
            className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-black"
          >
            {title}
          </button>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 text-neutral-700 ring-1 ring-black/5 transition hover:bg-white"
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand FAST Code card" : "Collapse FAST Code card"}
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-4 w-4 transition-transform ${collapsed ? "" : "rotate-180"}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>

        {!collapsed ? (
          <button
            type="button"
            onClick={onSelectListing}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto text-left"
          >
            <div
              className={`relative ${MAPSITE_LISTING_HERO_HEIGHT_CLASS} w-full shrink-0 bg-neutral-200/80`}
            >
              <Image
                src={heroImage}
                alt={mapsite.property_title}
                fill
                className={MAPSITE_LISTING_IMAGE_CLASS}
                sizes="352px"
                unoptimized
              />
            </div>

            <div className="space-y-2 px-4 py-3">
              <h2 className="text-[22px] font-semibold leading-tight tracking-tight text-black">
                {title}
              </h2>
              <p className="text-sm font-semibold leading-snug text-black">
                {mapsite.property_address}
              </p>
              <div className="border-t border-dashed border-neutral-300/80 pt-2">
                <p className="text-[13px] leading-relaxed text-black">
                  {showFastCode || showsResourceActions(mapsite.status)
                    ? MAPSITE_DEMO_SIDEBAR_BLURB
                    : "Welcome to Talispros™. Choose your market and begin onboarding."}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1 text-sm text-black">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1A73E8] text-white">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M12 3 4 9v11h5v-6h6v6h5V9l-8-6Z" />
                  </svg>
                </span>
                <span className="font-medium">{mapsite.property_title}</span>
              </div>
            </div>
          </button>
        ) : null}
      </div>

      {belowCard}
    </aside>
  );
}
