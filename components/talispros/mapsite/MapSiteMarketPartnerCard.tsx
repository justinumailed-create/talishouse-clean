"use client";

import Image from "next/image";
import Link from "next/link";
import type { KeyboardEvent, RefObject } from "react";
import type { RegistrationMarket } from "@/lib/registration-market";
import {
  CLAIM_A_MARKET_PAGE,
  FOR_SALE_BY_OWNERS_MARKET,
  MAPSITE_MARKET_PARTNER_FALLBACK_NAME,
  MARKETING_PARTNER_CARD_INTRO,
  REAL_ESTATE_PROFESSIONALS_MARKET,
  TALISHHOUSE_BUILDERS_MARKET,
  mapsiteMarketPartnerImageUrl,
  type TalisprosMarketPageContent,
} from "@/lib/talispros/market-pages";
import { MAPSITE_LISTING_CARD_WIDTH_CLASS } from "@/lib/talispros/mapsite-listing-media";
import type { MapSitePlatformRecord } from "@/lib/talispros/mapsite-platform";
import MapSiteAgencyLogo from "./MapSiteAgencyLogo";
import MarketingPartnerInterestLinks from "./MarketingPartnerInterestLinks";
import MapSiteOwnerLogoutButton from "./MapSiteOwnerLogoutButton";
import {
  TALISU_KB_MANAGE_PATH,
  isTalisUKbMapsiteManagerFastCode,
} from "@/lib/talisu/kb-content";

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

/** Default left-card partner photo for this audience (Logo & Image Editor reset). */
export function defaultMapSitePartnerImage(audience: RegistrationMarket): string {
  return mapsiteMarketPartnerImageUrl(null, contentForAudience(audience).partnerImage);
}

interface MapSiteMarketPartnerCardProps {
  audience: RegistrationMarket;
  mapsite: MapSitePlatformRecord;
  cardRef?: RefObject<HTMLDivElement | null>;
  onSelect?: () => void;
  /** Agency logo only after activation payment (solid card for demo + paid). */
  paid?: boolean;
  /** Browser owns this Mapsite™ (owner / paid session cookies). */
  isOwner?: boolean;
  /** Claimed path segment for Logout return (e.g. brokers, listings). */
  accountTypeSegment?: string | null;
  /**
   * Real activation payment unlocked Dashboard — show Knowledge Base manage
   * entry for rm22 (Ralf) Mapsite™ dashboard.
   */
  showKnowledgeBaseManage?: boolean;
  /** Owner Logo & Image Editor override for the partner photo slot. */
  partnerImageUrl?: string | null;
}

/**
 * Claimed Mapsite™ left card:
 * FAST CODE → address → partner photo → name → Marketing Partner → WhatsApp / Telegram.
 * The photo block is a div (not a tall <button>) so the parent sidebar can scroll.
 * Interest links sit outside that control so they are not nested buttons.
 */
export default function MapSiteMarketPartnerCard({
  audience,
  mapsite,
  cardRef,
  onSelect,
  paid = false,
  isOwner = false,
  accountTypeSegment = null,
  showKnowledgeBaseManage = false,
  partnerImageUrl = null,
}: MapSiteMarketPartnerCardProps) {
  const content = contentForAudience(audience);
  const fastCode = mapsite.fast_code?.trim().toUpperCase() || null;
  const showKbManage =
    showKnowledgeBaseManage && isTalisUKbMapsiteManagerFastCode(fastCode);
  const address = mapsite.property_address?.trim().toUpperCase() || null;
  const partnerImage = mapsiteMarketPartnerImageUrl(
    partnerImageUrl,
    content.partnerImage,
  );
  const partnerName =
    mapsite.assigned_marketing_manager?.trim() ||
    MAPSITE_MARKET_PARTNER_FALLBACK_NAME;
  const partnerLabel = MARKETING_PARTNER_CARD_INTRO;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!onSelect) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  }

  // Solid opaque card for demo and paid claimed Mapsites™ (no frosted glass).
  const mobilePanel = paid
    ? "mapsite-manager-strip relative w-full overflow-hidden rounded-2xl bg-[#f2f2f0] p-4 text-left shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:hidden"
    : "mapsite-manager-strip relative w-full overflow-hidden rounded-2xl bg-[#f2f2f0] p-3 text-left shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:hidden";
  const desktopPanel = paid
    ? "relative hidden w-full overflow-hidden rounded-2xl bg-[#f2f2f0] px-5 py-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:block"
    : "relative hidden w-full overflow-hidden rounded-2xl bg-[#f2f2f0] px-4 py-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/5 sm:block sm:px-5";
  const selectableClass = onSelect
    ? "w-full cursor-pointer text-inherit transition hover:opacity-90"
    : "w-full text-inherit";

  return (
    <div
      ref={cardRef}
      className={`mapsite-market-partner-card shrink-0 ${MAPSITE_LISTING_CARD_WIDTH_CLASS}`}
    >
      <div className={mobilePanel}>
        <div
          role={onSelect ? "button" : undefined}
          tabIndex={onSelect ? 0 : undefined}
          onClick={onSelect}
          onKeyDown={onSelect ? handleKeyDown : undefined}
          className={`${selectableClass} flex gap-3 text-left`}
        >
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
                alt={partnerName}
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
                <p className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-wide text-black">
                  {address}
                </p>
              ) : null}
              <p className="mt-1 text-[13px] font-semibold leading-snug text-black">
                {partnerName}
              </p>
              <p className="text-[12px] font-semibold leading-snug text-black">
                {partnerLabel}
              </p>
            </div>
          </div>
        </div>
        <MarketingPartnerInterestLinks align="start" className="mt-3" />
        {showKbManage ? (
          <div className="mt-3 flex justify-start">
            <Link
              href={TALISU_KB_MANAGE_PATH}
              className="inline-flex min-h-8 items-center justify-center rounded-full bg-[#046BD9] px-3 text-[12px] font-semibold text-white transition hover:bg-[#035bb8]"
            >
              Knowledge Base
            </Link>
          </div>
        ) : null}
        {isOwner ? (
          <MapSiteOwnerLogoutButton
            fastCode={fastCode}
            accountType={accountTypeSegment}
            className="absolute top-2 right-2 z-20 inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
          />
        ) : null}
      </div>

      <div className={desktopPanel}>
        <div
          role={onSelect ? "button" : undefined}
          tabIndex={onSelect ? 0 : undefined}
          onClick={onSelect}
          onKeyDown={onSelect ? handleKeyDown : undefined}
          className={selectableClass}
        >
          {paid ? (
            <div className="relative mb-4">
              <MapSiteAgencyLogo
                logoUrl={mapsite.logo_url}
                agencyName={mapsite.agency_name}
              />
            </div>
          ) : null}
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

          <div className="relative mx-auto mt-4 max-w-[150px]">
            <Image
              src={partnerImage}
              alt={partnerName}
              width={896}
              height={1200}
              className="mx-auto h-auto w-full"
              sizes="150px"
            />
          </div>

          <p className="mt-4 text-[14px] font-semibold leading-snug text-black">
            {partnerName}
          </p>
          <p className="mt-1 text-[13px] font-semibold leading-snug text-black">
            {partnerLabel}
          </p>
        </div>
        <MarketingPartnerInterestLinks className="mt-4" />
        {showKbManage ? (
          <div className="mt-4 flex justify-center">
            <Link
              href={TALISU_KB_MANAGE_PATH}
              className="inline-flex min-h-8 items-center justify-center rounded-full bg-[#046BD9] px-3 text-[12px] font-semibold text-white transition hover:bg-[#035bb8]"
            >
              Knowledge Base
            </Link>
          </div>
        ) : null}
        {isOwner ? (
          <MapSiteOwnerLogoutButton
            fastCode={fastCode}
            accountType={accountTypeSegment}
            className="absolute top-2 right-2 z-20 inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
          />
        ) : null}
      </div>
    </div>
  );
}
