"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { MapSitePlatformRecord } from "@/lib/talispros/mapsite-platform";
import {
  getMapSiteListingGalleryImages,
  getMapSiteListingHeroImage,
  getMapSiteListingPhotoCount,
  MAPSITE_LISTING_CARD_WIDTH_CLASS,
  MAPSITE_LISTING_IMAGE_CLASS,
  MAPSITE_LISTING_TILE_TOP_FALLBACK_PX,
  shouldReplaceDemoListingMedia,
} from "@/lib/talispros/mapsite-listing-media";
import { ROUTES } from "@/lib/routes";
import { isClaimable } from "@/lib/talispros/mapsite-state";
import {
  capabilitiesForAccountType,
  type MapSiteCapabilityAccountType,
  type MapSiteResourceKey,
} from "@/lib/talispros/account-capabilities";
import {
  showsActiveResourceButtons,
  type MapSiteOnboardingPhase,
} from "@/lib/talispros/mapsite-onboarding-phase";
import MapSitePhotoGallery from "./MapSitePhotoGallery";

type ResourceKey = MapSiteResourceKey;

const RESOURCES: {
  key: ResourceKey;
  label: string;
  resolveHref: (site: MapSitePlatformRecord) => string | null;
}[] = [
  {
    key: "mls",
    label: "MLS®",
    resolveHref: (site) => site.mls_url?.trim() || null,
  },
  {
    key: "url",
    label: "URL",
    resolveHref: (site) => site.broker_url?.trim() || null,
  },
  {
    key: "teb",
    label: "TEB™",
    resolveHref: (site) => {
      const custom = site.teb_url?.trim() || "";
      const code = site.fast_code?.trim();
      // Prefer FAST-code shelf unless admin set a fully custom absolute TEB URL.
      if (custom && /^https?:\/\//i.test(custom)) return custom;
      if (code) {
        return `${ROUTES.TALISBOOKS_LIBRARY}?fastCode=${encodeURIComponent(code)}`;
      }
      if (custom.startsWith("/")) return custom;
      return ROUTES.TALISBOOKS_LIBRARY;
    },
  },
  {
    key: "ttv",
    label: "TTV™",
    resolveHref: (site) => site.ttv_url?.trim() || ROUTES.TALISTV,
  },
];

function ResourceButton({
  href,
  label,
}: {
  href: string | null;
  label: string;
}) {
  const disabled = !href;
  const className = disabled
    ? "mapsite-paypal-btn mapsite-paypal-btn--disabled"
    : "mapsite-paypal-btn";

  if (disabled) {
    return (
      <span
        className={className}
        aria-label={`${label} unavailable`}
        aria-disabled="true"
        title={`${label} not configured yet`}
      >
        {label}
      </span>
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
  claimLabel = "Build My Mapsite™",
  genericOnboardingCard = false,
  accountType = "derivative",
  onboardingPhase,
  talisBookHref = null,
  alignTop = MAPSITE_LISTING_TILE_TOP_FALLBACK_PX,
  centerX = null,
  cardHeight = null,
  compact = false,
  onClose,
}: MapSitePropertyPopupProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const claimable = isClaimable(mapsite.status);
  const showActiveResources = showsActiveResourceButtons(onboardingPhase);
  const capabilities = capabilitiesForAccountType(accountType);
  const visibleResources = RESOURCES.filter((resource) =>
    capabilities.resourceButtons.includes(resource.key)
  );
  const heroImage = getMapSiteListingHeroImage(mapsite);
  const galleryImages = getMapSiteListingGalleryImages(mapsite);
  const photoCount = getMapSiteListingPhotoCount(mapsite);
  const genericHeroImage = "/talisbooks/sample/img-11-1280x720.jpeg";
  const useGenericCard = genericOnboardingCard || claimable;
  const hasUploadedPropertyMedia = !shouldReplaceDemoListingMedia(
    mapsite.cover_image,
    mapsite.gallery_images
  );
  const showPhotoBadge = !useGenericCard && hasUploadedPropertyMedia;
  const fastCode = mapsite.fast_code?.trim().toUpperCase() || null;
  const address =
    mapsite.property_address?.trim() ||
    mapsite.property_title?.trim() ||
    null;
  const showPendingActions =
    onboardingPhase === "BUILD_SUBMITTED" || onboardingPhase === "BOOK_READY";
  const showBookButton = Boolean(talisBookHref);
  const pendingHasActions =
    showPendingActions &&
    (showBookButton || onboardingPhase === "BUILD_SUBMITTED");
  const showActiveBookButton =
    showActiveResources && showBookButton && Boolean(talisBookHref);
  const popupHeroImage = useGenericCard ? genericHeroImage : heroImage;
  const popupTitle = useGenericCard
    ? "The first of many E-Books"
    : mapsite.property_title;
  const popupWriteup = useGenericCard
    ? "Upon registration your Mapsite™ will be able to promote up to 10 categories containing 100 PINs generating 1,000 views, monthly. No referral fees - ever"
    : address ||
      mapsite.property_description ||
      "Welcome to Talispros™. Choose your market and begin onboarding.";
  const popupClaimLabel = useGenericCard ? "Register Account now" : claimLabel;

  return (
    <>
      <div
        role="dialog"
        aria-label={mapsite.property_title}
        className={`pointer-events-none absolute z-30 ${MAPSITE_LISTING_CARD_WIDTH_CLASS} -translate-x-1/2`}
        style={{
          top: alignTop,
          left: centerX == null ? "50%" : centerX,
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
                : showActiveResources || pendingHasActions || showActiveBookButton
                ? "h-[120px]"
                : compact
                  ? "h-28"
                  : "h-36"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                if (!showPhotoBadge) return;
                setGalleryOpen(true);
              }}
              className="absolute inset-0 z-0"
              aria-label={
                showPhotoBadge
                  ? `View ${photoCount} photo${photoCount === 1 ? "" : "s"}`
                  : "Property image"
              }
            >
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
            </button>

            <button
              type="button"
              onClick={onClose}
              className="absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/50 text-[17px] leading-none text-neutral-700 shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition hover:bg-white/70"
              aria-label="Close"
            >
              ×
            </button>

            {showPhotoBadge ? (
              <button
                type="button"
                onClick={() => setGalleryOpen(true)}
                className="absolute bottom-2.5 right-2.5 z-10 inline-flex min-h-8 items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-black/90"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Z" />
                  <circle cx="12" cy="13" r="3.25" />
                </svg>
                {photoCount} Photo{photoCount === 1 ? "" : "s"}
              </button>
            ) : null}
          </div>

          <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-white/65 to-white/75 px-4 pb-3 pt-2.5">
            <h2 className="shrink-0 text-[15px] font-semibold leading-snug tracking-tight text-black">
              {popupTitle}
            </h2>
            {useGenericCard ? null : fastCode ? (
              <p className="mt-1 shrink-0 text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">
                FAST Code: {fastCode}
              </p>
            ) : (
              <p className="mt-1 shrink-0 text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">
                {capabilities.displayName}
              </p>
            )}
            {useGenericCard ? null : (
              <p
                className={`mt-1 min-h-0 shrink text-[12px] leading-[1.35] text-black ${
                  useGenericCard ? "line-clamp-4" : "line-clamp-3"
                }`}
              >
                {popupWriteup}
              </p>
            )}

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

            {!useGenericCard && showPendingActions ? (
              <div className="mt-auto flex shrink-0 flex-col gap-2 pt-2.5">
                {onboardingPhase === "BUILD_SUBMITTED" && !showBookButton ? (
                  <p className="text-[12px] leading-snug text-neutral-600">
                    Your first Talisbook™ is being prepared. You&apos;ll see View
                    Your Talisbook™ here when it&apos;s ready.
                  </p>
                ) : null}
                {showBookButton && talisBookHref ? (
                  <Link
                    href={talisBookHref}
                    className="flex min-h-11 w-full items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
                  >
                    View Your Talisbook™
                  </Link>
                ) : null}
              </div>
            ) : null}

            {!useGenericCard && showActiveResources ? (
              <div
                className={`mt-auto flex shrink-0 flex-col gap-2 ${
                  showPendingActions ? "pt-0" : "pt-2.5"
                }`}
              >
                {showActiveBookButton && talisBookHref ? (
                  <Link
                    href={talisBookHref}
                    className="flex min-h-11 w-full items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
                  >
                    View Your Talisbook™
                  </Link>
                ) : null}
                {visibleResources.length > 0 ? (
                  <div className="grid grid-cols-4 gap-1.5">
                    {visibleResources.map((resource) => (
                      <ResourceButton
                        key={resource.key}
                        href={
                          resource.key === "teb" && talisBookHref
                            ? talisBookHref
                            : resource.resolveHref(mapsite)
                        }
                        label={resource.label}
                      />
                    ))}
                  </div>
                ) : null}
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

      {galleryOpen ? (
        <MapSitePhotoGallery
          title={mapsite.property_title}
          images={galleryImages}
          onClose={() => setGalleryOpen(false)}
        />
      ) : null}
    </>
  );
}
