"use client";

import Image from "next/image";
import Link from "next/link";
import type { MapSitePlatformRecord } from "@/lib/talispros/mapsite-platform";
import {
  getMapSiteListingHeroImage,
  MAPSITE_LISTING_CARD_WIDTH_CLASS,
  MAPSITE_LISTING_IMAGE_CLASS,
  MAPSITE_LISTING_TILE_TOP_FALLBACK_PX,
} from "@/lib/talispros/mapsite-listing-media";
import {
  MAPSITE_PIN_TIP_CLEARANCE_PX,
} from "@/lib/talispros/mapsite-overlay-layout";
import { ROUTES } from "@/lib/routes";
import { useT } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/format";
import { isClaimable } from "@/lib/talispros/mapsite-state";
import { mapsiteScheduleHref } from "@/lib/mapsite-layout";
import {
  listingResourceHref,
  MAPSITE_URL_ADDITIONAL_PINS_SENTINEL,
  resolvePublishedUrlButtonHref,
} from "@/lib/talispros/mapsite-url-gate";
import {
  capabilitiesForAccountType,
  type MapSiteCapabilityAccountType,
  type MapSiteResourceKey,
} from "@/lib/talispros/account-capabilities";
import {
  showsPinResourceButtons,
  type MapSiteOnboardingPhase,
} from "@/lib/talispros/mapsite-onboarding-phase";

type ResourceKey = MapSiteResourceKey;

const RESOURCES: {
  key: ResourceKey;
  label: string;
  variant: "blue" | "gold";
  resolveHref: (site: MapSitePlatformRecord) => string | null;
}[] = [
  {
    key: "url",
    label: "URL",
    variant: "blue",
    // Resolved in render: Register for visitors, multipin Dashboard for paid owners.
    resolveHref: (site) =>
      resolvePublishedUrlButtonHref(site.fast_code, site.broker_url),
  },
  {
    key: "mls",
    label: "MLS®",
    variant: "blue",
    resolveHref: (site) => listingResourceHref(site.mls_url),
  },
  {
    key: "teb",
    label: "TEB™",
    variant: "blue",
    resolveHref: (site) => {
      const custom = site.teb_url?.trim() || "";
      const code = site.fast_code?.trim();
      // Prefer FAST-code shelf unless admin set a fully custom absolute TEB URL.
      if (custom && /^https?:\/\//i.test(custom)) return custom;
      if (code) {
        return `${ROUTES.TALISBOOKS}/fast/${encodeURIComponent(code.toLowerCase())}`;
      }
      if (custom.startsWith("/")) return custom;
      return ROUTES.TALISBOOKS;
    },
  },
  {
    key: "ttv",
    label: "TTV™",
    variant: "gold",
    resolveHref: (site) => mapsiteScheduleHref(site.fast_code || ""),
  },
];

function ResourceButton({
  href,
  label,
  variant,
  onActionClick,
}: {
  href: string | null;
  label: string;
  variant: "blue" | "gold";
  onActionClick?: () => void;
}) {
  const t = useT();
  const disabled = !href;
  const className = [
    "mapsite-paypal-btn",
    variant === "gold" ? "mapsite-paypal-btn--gold" : "",
    disabled ? "mapsite-paypal-btn--disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (disabled) {
    return (
      <span
        className={className}
        aria-label={fmt(t.mapsite.popup.resourceUnavailable, { label })}
        aria-disabled="true"
        title={fmt(t.mapsite.popup.resourceNotConfigured, { label })}
      >
        {label}
      </span>
    );
  }

  if (href === MAPSITE_URL_ADDITIONAL_PINS_SENTINEL && onActionClick) {
    return (
      <button
        type="button"
        className={className}
        aria-label={label}
        onClick={onActionClick}
      >
        {label}
      </button>
    );
  }

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className} aria-label={label}>
        {label}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      aria-label={label}
    >
      {label}
    </a>
  );
}

interface MapSitePropertyPopupProps {
  mapsite: MapSitePlatformRecord;
  claimHref: string;
  claimLabel?: string;
  genericOnboardingCard?: boolean;
  accountType?: MapSiteCapabilityAccountType;
  /** UI onboarding phase (derived; not a DB status). */
  onboardingPhase: MapSiteOnboardingPhase;
  /** Viewer href for View Your Talisbook™ (pending / book-ready). */
  talisBookHref?: string | null;
  /**
   * Paid owner / Mapsite admin: URL opens multipin (additional PIN) purchase
   * instead of Register.
   */
  canBuyAdditionalPins?: boolean;
  /** Opens Dashboard → PIN Dashboard (buy additional PINs). */
  onOpenAdditionalPins?: () => void;
  /** Top of the FAST Code card — shared with pin popup. */
  alignTop?: number;
  /** Horizontal center of the popup in root coordinates (px). */
  centerX?: number | null;
  /** Matched height with the FAST Code card so the tip stays above the pin. */
  cardHeight?: number | null;
  /** Narrow layout: slightly tighter hero so the card fits above the shifted pin. */
  compact?: boolean;
  onClose: () => void;
}

/**
 * Floating listing card. Top + height match the FAST Code card on wide screens;
 * on compact screens it sits below the left stack with the tip above the pin.
 */
export default function MapSitePropertyPopup({
  mapsite,
  claimHref,
  claimLabel = "Build My Mapsite",
  genericOnboardingCard = false,
  accountType = "derivative",
  onboardingPhase,
  talisBookHref = null,
  canBuyAdditionalPins = false,
  onOpenAdditionalPins,
  alignTop = MAPSITE_LISTING_TILE_TOP_FALLBACK_PX,
  centerX = null,
  cardHeight = null,
  compact = false,
  onClose,
}: MapSitePropertyPopupProps) {
  const t = useT();
  const p = t.mapsite.popup;
  const claimable = isClaimable(mapsite.status);
  const showResourceButtons = showsPinResourceButtons(onboardingPhase);
  const capabilities = capabilitiesForAccountType(accountType);
  const heroImage = getMapSiteListingHeroImage(mapsite);
  const genericHeroImage = "/talisbooks/sample/img-11-1280x720.jpeg";
  const useGenericCard = genericOnboardingCard || claimable;
  const fastCode = mapsite.fast_code?.trim().toUpperCase() || null;
  const propertyAddress = mapsite.property_address?.trim() || null;
  const propertyTitle = mapsite.property_title?.trim() || null;
  const demoishTitle =
    !propertyTitle ||
    /^demo(\s|$)/i.test(propertyTitle) ||
    /mapsite/i.test(propertyTitle);
  const address = propertyAddress || propertyTitle || null;
  const showPendingActions =
    onboardingPhase === "BUILD_SUBMITTED" || onboardingPhase === "BOOK_READY";
  const tebHref =
    RESOURCES.find((resource) => resource.key === "teb")?.resolveHref(
      mapsite,
    ) ?? null;
  const popupHeroImage = useGenericCard ? genericHeroImage : heroImage;
  // Claimed / live cards prefer the property address — never stay stuck on a demo title.
  const popupTitle = useGenericCard
    ? p.genericTitle
    : propertyAddress || (demoishTitle ? address : propertyTitle) || p.yourMapsite;
  const rawDescription = mapsite.property_description?.trim() || "";
  const demoNotIssuedCopy =
    /no fast code is issued/i.test(rawDescription) ||
    /^demonstration mapsite/i.test(rawDescription);
  // After FAST Code™ issue, never keep demonstration “not issued” pin copy.
  const issuedDescription =
    fastCode && demoNotIssuedCopy
      ? null
      : rawDescription || null;
  const popupWriteup = useGenericCard
    ? p.genericWriteup
    : (propertyAddress && !demoishTitle && propertyTitle && propertyTitle !== propertyAddress
        ? propertyTitle
        : null) ||
      issuedDescription ||
      (propertyAddress ? propertyAddress : null) ||
      (fastCode
        ? fmt(p.claimedFallback, { code: fastCode })
        : p.welcomeFallback);
  const localizedClaimLabel =
    claimLabel === "Register Account now"
      ? t.mapsite.registerAccountNow
      : claimLabel === "Build My Mapsite"
        ? t.mapsite.buildMyMapsite
        : claimLabel;
  const popupClaimLabel = useGenericCard
    ? t.mapsite.registerAccountNow
    : localizedClaimLabel;

  return (
    <>
      <div
        role="dialog"
        aria-label={mapsite.property_title}
        className={`pointer-events-none absolute z-30 ${MAPSITE_LISTING_CARD_WIDTH_CLASS} -translate-x-1/2`}
        style={{
          left: centerX == null ? "50%" : centerX,
          ...(cardHeight
            ? { top: alignTop }
            : {
                top: "auto",
                bottom: `calc(50% + ${MAPSITE_PIN_TIP_CLEARANCE_PX}px)`,
              }),
        }}
      >
        <div
          className="mapsite-popup-card pointer-events-auto flex flex-col overflow-hidden rounded-2xl bg-white/75 shadow-[0_12px_40px_rgba(0,0,0,0.28)] ring-1 ring-black/5 backdrop-blur-sm"
          style={cardHeight ? { height: cardHeight } : undefined}
        >
          <div
            className={`mapsite-popup-hero relative w-full shrink-0 bg-neutral-200/80 ${
              useGenericCard
                ? "aspect-video"
                : showResourceButtons
                ? "aspect-[16/9]"
                : compact
                  ? "h-28"
                  : "h-36"
            }`}
          >
            <div className="absolute inset-0 z-0">
              <span className="relative block h-full w-full">
                <Image
                  src={popupHeroImage}
                  alt={popupTitle}
                  fill
                  className={MAPSITE_LISTING_IMAGE_CLASS}
                  sizes="352px"
                  unoptimized
                  priority
                />
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/50 text-[17px] leading-none text-neutral-700 shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition hover:bg-white/70"
              aria-label={t.mapsite.close}
            >
              ×
            </button>
          </div>

          <div className="flex flex-col bg-gradient-to-b from-white/65 to-white/75 px-4 pb-3 pt-1.5">
            <div className="shrink-0">
              <h2 className="m-0 text-[15px] font-semibold leading-tight tracking-tight text-black">
                {popupTitle}
              </h2>
              {useGenericCard ? null : fastCode ? (
                <p className="m-0 text-[11px] font-medium uppercase leading-tight tracking-[0.08em] text-neutral-500">
                  FAST Code: {fastCode}
                </p>
              ) : (
                <p className="m-0 text-[11px] font-medium uppercase leading-tight tracking-[0.08em] text-neutral-500">
                  {capabilities.displayName}
                </p>
              )}
              {useGenericCard ? null : (
                <p className="m-0 text-[12px] leading-tight text-black line-clamp-2">
                  {popupWriteup}
                </p>
              )}
            </div>

            {useGenericCard ? (
              <div className="mt-auto flex justify-center pt-2">
                <Link
                  href={talisBookHref || "/talisbooks/library"}
                  className="inline-flex min-h-8 items-center justify-center rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800"
                >
                  View Talisbook™
                </Link>
              </div>
            ) : null}

            {!useGenericCard && claimable ? (
              <Link
                href={claimHref}
                className="mt-auto flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl border border-neutral-200/80 bg-white/75 px-4 py-2 text-sm font-medium text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] backdrop-blur-sm transition hover:border-neutral-300 hover:bg-white/85"
              >
                {popupClaimLabel}
              </Link>
            ) : null}

            {!useGenericCard && showResourceButtons ? (
              <div className="mt-2 flex shrink-0 flex-col gap-2">
                {showPendingActions && !tebHref ? (
                  <p className="text-[12px] leading-snug text-neutral-600">
                    {p.tebPreparing}
                  </p>
                ) : null}
                <div className="grid grid-cols-4 gap-1.5">
                  {RESOURCES.map((resource) => {
                    const href =
                      resource.key === "url"
                        ? resolvePublishedUrlButtonHref(
                            mapsite.fast_code,
                            mapsite.broker_url,
                            { canBuyAdditionalPins },
                          )
                        : resource.resolveHref(mapsite);
                    return (
                      <ResourceButton
                        key={resource.key}
                        href={href}
                        label={resource.label}
                        variant={resource.variant}
                        onActionClick={
                          resource.key === "url" && canBuyAdditionalPins
                            ? onOpenAdditionalPins
                            : undefined
                        }
                      />
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Tip sits on the shared card bottom — pin renders just below at map center. */}
        <div
          className="pointer-events-none mx-auto -mt-px h-0 w-0 border-l-[11px] border-r-[11px] border-t-[12px] border-l-transparent border-r-transparent border-t-white/75 drop-shadow-[0_2px_2px_rgba(0,0,0,0.12)]"
          aria-hidden
        />
      </div>

    </>
  );
}
