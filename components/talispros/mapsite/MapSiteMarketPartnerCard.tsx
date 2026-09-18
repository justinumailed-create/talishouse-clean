"use client";

import Image from "next/image";
import type { KeyboardEvent, RefObject } from "react";
import type { RegistrationMarket } from "@/lib/registration-market";
import {
  CLAIM_A_MARKET_PAGE,
  FOR_SALE_BY_OWNERS_MARKET,
  REAL_ESTATE_PROFESSIONALS_MARKET,
  TALISHHOUSE_BUILDERS_MARKET,
  mapsiteMarketPartnerImageUrl,
  mapsiteMarketPartnerLabel,
  type TalisprosMarketPageContent,
} from "@/lib/talispros/market-pages";
import { MAPSITE_LISTING_CARD_WIDTH_CLASS } from "@/lib/talispros/mapsite-listing-media";
import {
  MAPSITE_DEMO_SIDEBAR_BLURB,
  mapsiteMarketPartnerWriteup,
  type MapSitePlatformRecord,
} from "@/lib/talispros/mapsite-platform";
import MapSiteAgencyLogo from "./MapSiteAgencyLogo";

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
  isDemoEbook?: boolean;
  /** Agency logo + cloud vignette only after activation payment. */
  paid?: boolean;
}

/**
 * Claimed Mapsite™ left card:
 * FAST CODE → address → partner photo → Market Partner → writeup → register blurb.
 * Uses a div (not a tall <button>) so the parent sidebar can scroll.
 */
export default function MapSiteMarketPartnerCard({
  audience,
  mapsite,
  cardRef,
  onSelect,
  isDemoEbook = false,
  paid = false,
}: MapSiteMarketPartnerCardProps) {
  const content = contentForAudience(audience);
  const genericWriteup = mapsiteMarketPartnerWriteup(isDemoEbook);
  const fastCode = mapsite.fast_code?.trim().toUpperCase() || null;
  const address = mapsite.property_address?.trim().toUpperCase() || null;
  const partnerImage = mapsiteMarketPartnerImageUrl(
    mapsite.profile_image_url,
    content.partnerImage,
  );
  const partnerLabel = mapsiteMarketPartnerLabel(
    mapsite.profile_image_url,
    mapsite.agent_name,
    content.marketPartner,
  );

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!onSelect) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  }

  const copyClass = paid ? "mapsite-cloud-copy relative" : "";
  const mobileShell = paid
    ? "mapsite-manager-strip relative isolate flex w-full cursor-pointer flex-col gap-3 p-4 text-left sm:hidden"
    : "mapsite-manager-strip flex w-full cursor-pointer gap-3 overflow-hidden rounded-2xl bg-[#f2f2f0] p-3 text-left shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/5 transition hover:bg-[#ecece8] sm:hidden";
  const desktopShell = paid
    ? "relative isolate hidden w-full cursor-pointer px-5 py-6 text-center sm:block"
    : "hidden w-full cursor-pointer overflow-hidden rounded-2xl bg-[#f2f2f0] px-4 py-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/5 transition hover:bg-[#ecece8] sm:block sm:px-5";

  return (
    <div
      ref={cardRef}
      className={`mapsite-market-partner-card shrink-0 ${MAPSITE_LISTING_CARD_WIDTH_CLASS}`}
    >
      <div
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onClick={onSelect}
        onKeyDown={onSelect ? handleKeyDown : undefined}
        className={mobileShell}
      >
        {paid ? (
          <div aria-hidden="true" className="mapsite-cloud-vignette mapsite-cloud-vignette--panel" />
        ) : null}
        {paid ? (
          <MapSiteAgencyLogo
            logoUrl={mapsite.logo_url}
            agencyName={mapsite.agency_name}
            compact
          />
        ) : null}
        <div className={paid ? "relative flex gap-3" : "contents"}>
          <div className="mapsite-manager-strip__photo relative z-0 h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-200">
            <Image
              src={partnerImage}
              alt={partnerLabel}
              fill
              className="object-cover object-top"
              sizes="64px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`${copyClass} text-[13px] font-bold uppercase tracking-wide text-black`}>
              {fastCode ? `FAST CODE: ${fastCode}` : "Claim received"}
            </p>
            {address ? (
              <p className={`${copyClass} mt-0.5 truncate text-[11px] font-bold uppercase tracking-wide text-black`}>
                {address}
              </p>
            ) : null}
            <p className={`${copyClass} mt-1 text-[13px] font-semibold leading-snug text-black`}>
              {partnerLabel}
            </p>
            <p className={`mapsite-manager-strip__why ${copyClass} mt-1 line-clamp-2 text-[11px] font-semibold leading-snug text-black`}>
              {genericWriteup}
            </p>
            <p className={`mapsite-manager-strip__blurb ${copyClass} mt-0.5 line-clamp-2 text-[11px] font-semibold leading-snug text-black`}>
              {MAPSITE_DEMO_SIDEBAR_BLURB}
            </p>
          </div>
        </div>
      </div>

      <div
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onClick={onSelect}
        onKeyDown={onSelect ? handleKeyDown : undefined}
        className={desktopShell}
      >
        {paid ? (
          <div aria-hidden="true" className="mapsite-cloud-vignette mapsite-cloud-vignette--panel" />
        ) : null}
        {paid ? (
          <div className="relative mb-4">
            <MapSiteAgencyLogo
              logoUrl={mapsite.logo_url}
              agencyName={mapsite.agency_name}
            />
          </div>
        ) : null}
        {fastCode ? (
          <p className={`${copyClass} text-[15px] font-bold uppercase tracking-wide text-black`}>
            FAST CODE: {fastCode}
          </p>
        ) : (
          <p className={`${copyClass} text-[15px] font-bold uppercase tracking-wide text-black`}>
            Claim received
          </p>
        )}

        {address ? (
          <p className={`${copyClass} mt-2 text-[12px] font-bold uppercase leading-snug tracking-wide text-black`}>
            {address}
          </p>
        ) : null}

        <div className="relative mx-auto mt-4 max-w-[150px]">
          <Image
            src={partnerImage}
            alt={partnerLabel}
            width={896}
            height={1200}
            className="mx-auto h-auto w-full"
            sizes="150px"
          />
        </div>

        <p className={`${copyClass} mt-4 text-[14px] font-semibold leading-snug text-black`}>
          {partnerLabel}
        </p>

        <p className={`${copyClass} mx-auto mt-2 max-w-[17rem] text-left text-[14px] font-semibold leading-[1.45] text-black sm:text-center`}>
          {genericWriteup}
        </p>

        <p className={`${copyClass} mx-auto mt-2 max-w-[17rem] text-left text-[12px] font-semibold leading-[1.4] text-black sm:text-center`}>
          {MAPSITE_DEMO_SIDEBAR_BLURB}
        </p>
      </div>
    </div>
  );
}
