"use client";

import Image from "next/image";
import type { KeyboardEvent, RefObject } from "react";
import type { RegistrationMarket } from "@/lib/registration-market";
import {
  CLAIM_A_MARKET_PAGE,
  FOR_SALE_BY_OWNERS_MARKET,
  REAL_ESTATE_PROFESSIONALS_MARKET,
  TALISHHOUSE_BUILDERS_MARKET,
  type TalisprosMarketPageContent,
} from "@/lib/talispros/market-pages";
import { MAPSITE_LISTING_CARD_WIDTH_CLASS } from "@/lib/talispros/mapsite-listing-media";
import {
  MAPSITE_DEMO_SIDEBAR_BLURB,
  type MapSitePlatformRecord,
} from "@/lib/talispros/mapsite-platform";

function contentForAudience(audience: RegistrationMarket): TalisprosMarketPageContent {
  switch (audience) {
    case "listings":
      return REAL_ESTATE_PROFESSIONALS_MARKET;
    case "homes":
      return TALISHHOUSE_BUILDERS_MARKET;
    case "fsbos":
      return FOR_SALE_BY_OWNERS_MARKET;
    case "brokers":
    case "adpro":
    default:
      return CLAIM_A_MARKET_PAGE;
  }
}

interface MapSiteMarketPartnerCardProps {
  audience: RegistrationMarket;
  mapsite: MapSitePlatformRecord;
  cardRef?: RefObject<HTMLDivElement | null>;
  onSelect?: () => void;
}

/**
 * Claimed MapSite left card:
 * FAST CODE → address → partner photo → partner copy → register blurb.
 * Uses a div (not a tall <button>) so the parent sidebar can scroll.
 */
export default function MapSiteMarketPartnerCard({
  audience,
  mapsite,
  cardRef,
  onSelect,
}: MapSiteMarketPartnerCardProps) {
  const content = contentForAudience(audience);
  const fastCode = mapsite.fast_code?.trim().toUpperCase() || null;
  const address = mapsite.property_address?.trim().toUpperCase() || null;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!onSelect) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  }

  return (
    <div
      ref={cardRef}
      className={`shrink-0 ${MAPSITE_LISTING_CARD_WIDTH_CLASS}`}
    >
      <div
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onClick={onSelect}
        onKeyDown={onSelect ? handleKeyDown : undefined}
        className="mapsite-manager-strip flex w-full cursor-pointer gap-3 overflow-hidden rounded-2xl bg-[#f2f2f0] p-3 text-left shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/5 transition hover:bg-[#ecece8] sm:hidden"
      >
        <div className="mapsite-manager-strip__photo relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-200">
          <Image
            src={content.partnerImage}
            alt={content.partnerImageAlt}
            fill
            className="object-cover object-top"
            sizes="64px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold uppercase tracking-wide text-black">
            {fastCode ? `FAST CODE: ${fastCode}` : "Claim received"}
          </p>
          {address ? (
            <p className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-wide text-neutral-700">
              {address}
            </p>
          ) : null}
          <p className="mapsite-manager-strip__why mt-1 line-clamp-2 text-[11px] leading-snug text-neutral-700">
            {content.whyBody}
          </p>
          <p className="mt-1 text-[13px] font-semibold leading-snug text-black">
            {content.marketPartner}
          </p>
          <p className="mapsite-manager-strip__blurb mt-0.5 line-clamp-2 text-[11px] leading-snug text-neutral-600">
            {MAPSITE_DEMO_SIDEBAR_BLURB}
          </p>
        </div>
      </div>

      <div
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onClick={onSelect}
        onKeyDown={onSelect ? handleKeyDown : undefined}
        className="hidden w-full cursor-pointer overflow-hidden rounded-2xl bg-[#f2f2f0] px-4 py-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/5 transition hover:bg-[#ecece8] sm:block sm:px-5"
      >
        {fastCode ? (
          <p className="text-[15px] font-bold uppercase tracking-wide text-black">
            FAST CODE: {fastCode}
          </p>
        ) : (
          <p className="text-[15px] font-bold uppercase tracking-wide text-black">
            Claim received
          </p>
        )}

        {address ? (
          <p className="mt-2 text-[12px] font-bold uppercase leading-snug tracking-wide text-black">
            {address}
          </p>
        ) : null}

        <div className="mx-auto mt-4 max-w-[150px]">
          <Image
            src={content.partnerImage}
            alt={content.partnerImageAlt}
            width={896}
            height={1200}
            className="mx-auto h-auto w-full"
            sizes="150px"
          />
        </div>

        <p className="mx-auto mt-4 max-w-[17rem] text-left text-[11.5px] leading-[1.45] text-neutral-800 sm:text-center">
          {content.whyBody}
        </p>

        <p className="mt-4 text-[14px] font-semibold leading-snug text-black">
          {content.marketPartner}
        </p>

        <p className="mx-auto mt-2 max-w-[17rem] text-left text-[12px] font-medium leading-[1.4] text-black sm:text-center">
          {MAPSITE_DEMO_SIDEBAR_BLURB}
        </p>
      </div>
    </div>
  );
}
