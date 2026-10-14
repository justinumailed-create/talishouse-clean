"use client";

import Image from "next/image";
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
import { useT } from "@/lib/i18n/client";
import { cardPhoneHref } from "@/lib/talispros/mapsite-owner-customizations";

export type MapSitePinSwitchOption = { id: string; label: string };

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

/** Default left-card partner photo for this audience (Logo & Card Editor reset). */
export function defaultMapSitePartnerImage(audience: RegistrationMarket): string {
  return mapsiteMarketPartnerImageUrl(null, contentForAudience(audience).partnerImage);
}

/** Default left-card partner name (assigned marketing manager, else Aisha C.). */
export function defaultMapSitePartnerName(
  mapsite: Pick<MapSitePlatformRecord, "assigned_marketing_manager">,
): string {
  return (
    mapsite.assigned_marketing_manager?.trim() || MAPSITE_MARKET_PARTNER_FALLBACK_NAME
  );
}

/** Default left-card tagline. */
export const DEFAULT_MAPSITE_PARTNER_TAGLINE = MARKETING_PARTNER_CARD_INTRO;

interface MapSiteMarketPartnerCardProps {
  audience: RegistrationMarket;
  mapsite: MapSitePlatformRecord;
  cardRef?: RefObject<HTMLDivElement | null>;
  onSelect?: () => void;
  /** Agency logo only after activation payment (solid card for demo + paid). */
  paid?: boolean;
  /** Browser owns this Mapsite (owner / paid session cookies). */
  isOwner?: boolean;
  /** Claimed path segment for Logout return (e.g. brokers, listings). */
  accountTypeSegment?: string | null;
  /**
   * @deprecated The Knowledge Base pill was removed from account pages (the KB
   * lives under TalisU, top-right). Kept so callers still type-check.
   */
  showKnowledgeBaseManage?: boolean;
  /** Resolved partner photo (owner override via resolveMapSiteBranding). */
  partnerImageUrl?: string | null;
  /** Resolved partner name / tagline (owner overrides via resolveMapSiteBranding). */
  partnerName?: string | null;
  partnerTagline?: string | null;
  /** Owner overrides: title under the logo (e.g. "TSplits"), address, phone. */
  cardTitle?: string | null;
  cardAddress?: string | null;
  cardPhone?: string | null;
  /** Owner / admin Dashboard (moved here from the navbar). */
  dashboardItems?: ReadonlyArray<{ id: string; label: string }>;
  onSelectDashboardItem?: (id: string) => void;
  /** FAST Code PIN switcher (owner / admin): main PIN + additional PINs. */
  pinOptions?: ReadonlyArray<MapSitePinSwitchOption>;
  activePinId?: string | null;
  onSwitchPin?: (id: string) => void;
}

function CardPhone({ phone, label }: { phone: string; label: string }) {
  const href = cardPhoneHref(phone);
  const body = (
    <>
      <svg aria-hidden viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
        <path d="M2.5 3.5A1.5 1.5 0 0 1 4 2h2.1a1 1 0 0 1 .97.76l.7 2.8a1 1 0 0 1-.29.98L6.2 7.8a11 11 0 0 0 6 6l1.26-1.28a1 1 0 0 1 .98-.29l2.8.7a1 1 0 0 1 .76.97V16a1.5 1.5 0 0 1-1.5 1.5h-.5C8.6 17.5 2.5 11.4 2.5 4v-.5Z" />
      </svg>
      <span>{phone}</span>
    </>
  );
  return href ? (
    <a
      href={href}
      aria-label={`${label}: ${phone}`}
      data-testid="mapsite-card-phone"
      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#035bb8] hover:underline"
    >
      {body}
    </a>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold">{body}</span>
  );
}

function CardTools({
  dashboardItems,
  onSelectDashboardItem,
  pinOptions,
  activePinId,
  onSwitchPin,
  labels,
}: {
  dashboardItems?: ReadonlyArray<{ id: string; label: string }>;
  onSelectDashboardItem?: (id: string) => void;
  pinOptions?: ReadonlyArray<MapSitePinSwitchOption>;
  activePinId?: string | null;
  onSwitchPin?: (id: string) => void;
  labels: { dashboard: string; switchPin: string; menu: Record<string, string> };
}) {
  const showDashboard = Boolean(dashboardItems?.length && onSelectDashboardItem);
  const showPins = Boolean(pinOptions && pinOptions.length > 1 && onSwitchPin);
  if (!showDashboard && !showPins) return null;
  return (
    <div className="mt-4 space-y-3 border-t border-black/10 pt-3 text-left">
      {showPins ? (
        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          {labels.switchPin}
          <select
            data-testid="mapsite-pin-switcher"
            value={activePinId ?? ""}
            onChange={(event) => onSwitchPin!(event.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-[12px] font-semibold normal-case tracking-normal text-neutral-900"
          >
            {pinOptions!.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {showDashboard ? (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            {labels.dashboard}
          </p>
          <div className="mt-1 grid grid-cols-2 gap-1.5" data-testid="mapsite-card-dashboard">
            {dashboardItems!.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectDashboardItem!(item.id)}
                className="rounded-lg bg-white px-2 py-1.5 text-[11px] font-semibold text-neutral-800 ring-1 ring-black/10 transition hover:bg-[#035bb8] hover:text-white"
              >
                {labels.menu[item.id] ?? item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Claimed Mapsite left card:
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
  partnerImageUrl = null,
  partnerName: partnerNameOverride = null,
  partnerTagline = null,
  cardTitle = null,
  cardAddress = null,
  cardPhone = null,
  dashboardItems,
  onSelectDashboardItem,
  pinOptions,
  activePinId = null,
  onSwitchPin,
}: MapSiteMarketPartnerCardProps) {
  const t = useT();
  const content = contentForAudience(audience);
  const fastCode = mapsite.fast_code?.trim().toUpperCase() || null;
  const address =
    (cardAddress?.trim() || mapsite.property_address?.trim())?.toUpperCase() || null;
  const agencyName = cardTitle?.trim() || mapsite.agency_name;
  const phone = cardPhone?.trim() || null;
  const toolLabels = {
    dashboard: t.mapsite.leftCard.dashboard,
    switchPin: t.mapsite.leftCard.switchPin,
    menu: t.mapsite.dashboardMenu as Record<string, string>,
  };
  const tools = (
    <CardTools
      dashboardItems={dashboardItems}
      onSelectDashboardItem={onSelectDashboardItem}
      pinOptions={pinOptions}
      activePinId={activePinId}
      onSwitchPin={onSwitchPin}
      labels={toolLabels}
    />
  );
  const partnerImage = mapsiteMarketPartnerImageUrl(
    partnerImageUrl,
    content.partnerImage,
  );
  const partnerName =
    partnerNameOverride?.trim() || defaultMapSitePartnerName(mapsite);
  const ownerTagline = partnerTagline?.trim();
  const partnerLabel =
    ownerTagline && ownerTagline !== DEFAULT_MAPSITE_PARTNER_TAGLINE
      ? ownerTagline
      : t.mapsite.partnerIntro;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!onSelect) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  }

  // Solid opaque card for demo and paid claimed Mapsites (no frosted glass).
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
              agencyName={agencyName}
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
                {fastCode ? `FAST CODE: ${fastCode}` : t.mapsite.claimReceived}
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
              {phone ? <CardPhone phone={phone} label={t.mapsite.leftCard.call} /> : null}
            </div>
          </div>
        </div>
        <MarketingPartnerInterestLinks align="start" className="mt-3" />
        {tools}
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
                agencyName={agencyName}
              />
            </div>
          ) : null}
          {fastCode ? (
            <p className="text-[15px] font-bold uppercase tracking-wide text-black">
              FAST CODE: {fastCode}
            </p>
          ) : (
            <p className="text-[15px] font-bold uppercase tracking-wide text-black">
              {t.mapsite.claimReceived}
            </p>
          )}

          {address ? (
            <p className="mt-2 text-[12px] font-bold uppercase leading-snug tracking-wide text-black">
              {address}
            </p>
          ) : null}
          {phone ? (
            <p className="mt-1.5">
              <CardPhone phone={phone} label={t.mapsite.leftCard.call} />
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
        {tools}
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
