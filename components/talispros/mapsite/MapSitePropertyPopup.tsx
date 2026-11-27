"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { MapSitePlatformRecord } from "@/lib/talispros/mapsite-platform";
import {
  MAPSITE_LISTING_CARD_WIDTH_CLASS,
  MAPSITE_LISTING_IMAGE_CLASS,
  MAPSITE_LISTING_TILE_TOP_FALLBACK_PX,
} from "@/lib/talispros/mapsite-listing-media";
import {
  MAPSITE_PIN_TIP_CLEARANCE_PX,
  MAPSITE_POPUP_TIP_HEIGHT_PX,
} from "@/lib/talispros/mapsite-overlay-layout";
import { ROUTES } from "@/lib/routes";
import { useT } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/format";
import { isClaimable } from "@/lib/talispros/mapsite-state";
import {
  MAPSITE_URL_ADDITIONAL_PINS_SENTINEL,
  resolvePinListingUrl,
} from "@/lib/talispros/mapsite-url-gate";
import {
  type MapSiteCapabilityAccountType,
  type MapSiteResourceKey,
} from "@/lib/talispros/account-capabilities";
import {
  showsPinResourceButtons,
  type MapSiteOnboardingPhase,
} from "@/lib/talispros/mapsite-onboarding-phase";
import PinActionExplainer, { type PinActionExplainerId } from "@/components/talispros/mapsite/PinActionExplainer";
import MapSiteGreyFlagAction from "@/components/talispros/mapsite/MapSiteGreyFlagAction";
import { loadMapSiteFlagAttachmentsAction } from "@/app/talispros/mapsite/flag-actions";
import { greyFlagActionFor, type GreyFlagAction } from "@/lib/talispros/mapsite-flag-attachments";

type ResourceKey = MapSiteResourceKey;

/** PIN-card slot → grey flag one-click action (the "mls" slot is TVA™). */
const GREY_FLAG_ACTION: Record<ResourceKey, GreyFlagAction> = {
  url: "url",
  mls: "tva",
  teb: "teb",
  ttv: "ttv",
};

const PIN_EXPLAINER: Record<ResourceKey, PinActionExplainerId> = {
  url: "url",
  mls: "tva",
  teb: "teb",
  ttv: "ttv",
};

const RESOURCES: {
  key: ResourceKey;
  label: string;
  resolveHref: (site: MapSitePlatformRecord) => string | null;
}[] = [
  {
    key: "url",
    // Ralf (Nov 25): URL = MLS or brokerage listing, grey until a link is set.
    label: "URL",
    resolveHref: (site) => resolvePinListingUrl(site.mls_url, site.broker_url),
  },
  {
    key: "teb",
    // Was URL 2. TEB™ is the eBook.
    label: "TEB™",
    resolveHref: (site) => {
      const custom = site.teb_url?.trim() || "";
      const code = site.fast_code?.trim();
      // Prefer FAST-code shelf unless admin set a fully custom absolute TEB URL.
      if (custom && /^https?:\/\//i.test(custom)) return custom;
      // FAST Code with exactly one own eBook: open it directly in the viewer.
      const ownBook = site.teb_own_book_href?.trim() || "";
      if (ownBook.startsWith(`${ROUTES.TALISBOOKS_VIEWER}/`)) return ownBook;
      if (code) {
        return `${ROUTES.TALISBOOKS}/fast/${encodeURIComponent(code.toLowerCase())}`;
      }
      if (custom.startsWith("/")) return custom;
      return ROUTES.TALISBOOKS;
    },
  },
  {
    key: "mls",
    // Was the TEB™ slot. TVA™ is not yet available, so it stays grey.
    label: "TVA™",
    resolveHref: () => null,
  },
  {
    key: "ttv",
    // TTV™ stays in the fourth slot and stays grey for now.
    label: "TTV™",
    resolveHref: () => null,
  },
];

function ResourceButton({
  href,
  label,
  onActionClick,
  onGreyClick,
}: {
  href: string | null;
  label: string;
  onActionClick?: () => void;
  /** Owner / editor: a grey link opens its one-click action instead. */
  onGreyClick?: () => void;
}) {
  const t = useT();
  const disabled = !href;
  const className = [
    "inline-flex min-h-9 w-full items-center justify-center whitespace-nowrap rounded-full px-1.5 text-center text-[11px] font-semibold sm:min-h-10 sm:px-2 sm:text-[13px]",
    disabled
      ? "cursor-not-allowed bg-neutral-300 text-neutral-500 shadow-none"
      : "bg-[#046BD9] text-white shadow-[0_6px_14px_rgba(4,107,217,0.3)] transition hover:bg-[#0558b3]",
  ].join(" ");

  if (disabled && onGreyClick) {
    return (
      <button
        type="button"
        className={className.replace("cursor-not-allowed", "cursor-pointer hover:bg-neutral-400")}
        aria-label={label}
        data-grey-flag-action="true"
        onClick={onGreyClick}
      >
        {label}
      </button>
    );
  }

  if (disabled) {
    return (
      <span
        className={className}
        aria-label={fmt(t.mapsite.popup.resourceUnavailable, { label })}
        aria-disabled="true"
        tabIndex={0}
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
  /** Fixed card width so the flag stays clear of corner controls. */
  widthPx?: number;
  /** Shorter hero, used when this flag sits in a half-page map. */
  dense?: boolean;
  /**
   * Extra pin: its own title and address. Null image means this pin has no
   * photo, so the main listing photo is not reused.
   */
  pinCard?: { title: string; detail: string } | null;
  /**
   * Owner / editor (Ralf, Nov 27 item #8): clicking a grey URL, TEB, TVA or
   * TTV link opens one focused action. Visitors keep the hover message only.
   */
  canManageFlags?: boolean;
  /** Current listing URL (live after a save from the Dashboard or a grey flag). */
  listingUrl?: string | null;
  onListingUrlSaved?: (url: string | null) => void;
  onClose: () => void;
}

/**
 * Floating listing card shrink-wraps the title and 2x2 action buttons, with
 * its tip sitting directly above the map pin — the same compact flag treatment
 * as the /mapsites demo PIN card, minus the photo and write-up.
 */
export default function MapSitePropertyPopup({
  mapsite,
  claimHref,
  claimLabel = "Build My Mapsite",
  genericOnboardingCard = false,
  onboardingPhase,
  talisBookHref = null,
  alignTop = MAPSITE_LISTING_TILE_TOP_FALLBACK_PX,
  centerX = null,
  cardHeight = null,
  widthPx,
  dense = false,
  pinCard = null,
  canManageFlags = false,
  listingUrl,
  onListingUrlSaved,
  onClose,
}: MapSitePropertyPopupProps) {
  const t = useT();
  const p = t.mapsite.popup;
  const [greyAction, setGreyAction] = useState<GreyFlagAction | null>(null);
  const [attachments, setAttachments] = useState<{ teb: string | null; tva: string | null }>({
    teb: null,
    tva: null,
  });
  const fastCode = mapsite.fast_code?.trim() || "";
  useEffect(() => {
    if (!fastCode) return;
    let cancelled = false;
    void loadMapSiteFlagAttachmentsAction({ fastCode })
      .then((found) => {
        if (!cancelled) setAttachments(found);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [fastCode]);
  const resourceHref = (key: ResourceKey, resolved: string | null): string | null => {
    if (key === "url" && listingUrl !== undefined) return listingUrl?.trim() || resolved;
    // TVA™ opens the attached TEB summary once the owner has added one.
    if (key === "mls") return attachments.tva || resolved;
    return resolved;
  };
  const claimable = isClaimable(mapsite.status);
  const showResourceButtons = showsPinResourceButtons(onboardingPhase);
  const genericHeroImage = "/talisbooks/sample/img-11-1280x720.jpeg";
  const useGenericCard = genericOnboardingCard || claimable;
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
  const popupHeroImage = useGenericCard ? genericHeroImage : null;
  // Claimed / live cards prefer the property address — never stay stuck on a demo title.
  const popupTitle = pinCard
    ? pinCard.title
    : useGenericCard
    ? p.genericTitle
    : propertyAddress || (demoishTitle ? address : propertyTitle) || p.yourMapsite;
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
        aria-label={popupTitle}
        data-testid="mapsite-pin-card"
        data-pin-flag
        className={`pointer-events-none absolute z-30 ${widthPx ? "" : MAPSITE_LISTING_CARD_WIDTH_CLASS} -translate-x-1/2${cardHeight ? " -translate-y-full" : ""}`}
        style={{
          width: widthPx,
          left: centerX == null ? "50%" : centerX,
          ...(cardHeight
            ? {
                // Anchor the shrink-wrapped card by its tip: the pin is already
                // placed under alignTop + cardHeight + tip, so sit the tip there
                // instead of stretching a frosted void down to the marker.
                top: alignTop + cardHeight + MAPSITE_POPUP_TIP_HEIGHT_PX,
              }
            : {
                top: "auto",
                bottom: `calc(50% + ${MAPSITE_PIN_TIP_CLEARANCE_PX}px)`,
              }),
        }}
      >
        <div className="mapsite-popup-card pointer-events-auto flex flex-col overflow-hidden rounded-2xl bg-white/75 shadow-[0_12px_40px_rgba(0,0,0,0.28)] ring-1 ring-black/5 backdrop-blur-sm">
          {useGenericCard ? (
          <div
            className={`mapsite-popup-hero relative w-full shrink-0 bg-neutral-200/80 ${
              dense
                ? "h-20 sm:h-24"
                : "aspect-video"
            }`}
          >
            <div className="absolute inset-0 z-0">
              {popupHeroImage ? (
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
              ) : (
                <span className="block h-full w-full bg-neutral-200" />
              )}
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
          ) : null}

          <div className="flex flex-col bg-gradient-to-b from-white/70 to-white/80 px-3.5 pb-3 pt-2">
            <div className="relative shrink-0 pr-10">
              <h2
                className="m-0 text-[15px] font-semibold leading-tight tracking-tight text-black"
                data-testid="mapsite-pin-card-title"
              >
                {popupTitle}
              </h2>
              {useGenericCard ? null : (
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-[17px] leading-none text-neutral-700 shadow-sm ring-1 ring-black/5 transition hover:bg-white"
                  aria-label={t.mapsite.close}
                >
                  ×
                </button>
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
              <div className="mt-2.5 flex shrink-0 flex-col gap-2">
                {showPendingActions && !tebHref ? (
                  <p className="text-[12px] leading-snug text-neutral-600">
                    {p.tebPreparing}
                  </p>
                ) : null}
                <div className="grid grid-cols-2 gap-1.5">
                  {RESOURCES.map((resource) => {
                    const href = resourceHref(resource.key, resource.resolveHref(mapsite));
                    const action = greyFlagActionFor({
                      flag: GREY_FLAG_ACTION[resource.key],
                      live: Boolean(href),
                      canManage: canManageFlags && Boolean(fastCode),
                    });
                    return (
                      <PinActionExplainer key={resource.key} action={PIN_EXPLAINER[resource.key]}>
                        <ResourceButton
                          href={href}
                          label={resource.label}
                          onGreyClick={action ? () => setGreyAction(action) : undefined}
                        />
                      </PinActionExplainer>
                    );
                  })}
                </div>
                {greyAction && canManageFlags ? (
                  <MapSiteGreyFlagAction
                    key={greyAction}
                    action={greyAction}
                    mapsiteId={mapsite.id}
                    fastCode={fastCode}
                    onClose={() => setGreyAction(null)}
                    onUrlSaved={(url) => onListingUrlSaved?.(url)}
                    onAttached={(kind, url) =>
                      setAttachments((current) => ({ ...current, [kind]: url }))
                    }
                  />
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

    </>
  );
}
