"use client";

import Image from "next/image";
import Link from "next/link";
import type { MapSitePlatformRecord } from "@/lib/talispros/mapsite-platform";
import {
  getMapSiteListingHeroImage,
  getMapSiteListingPhotoCount,
  MAPSITE_LISTING_CARD_WIDTH_CLASS,
  MAPSITE_LISTING_HERO_HEIGHT_CLASS,
  MAPSITE_LISTING_IMAGE_CLASS,
} from "@/lib/talispros/mapsite-listing-media";
import { ROUTES } from "@/lib/routes";
import {
  isClaimable,
  showsResourceActions,
} from "@/lib/talispros/mapsite-state";

type ResourceKey = "mls" | "url" | "teb" | "ttv";

const TALISPROS_START = "/talispros/start";

const RESOURCES: {
  key: ResourceKey;
  label: string;
  resolveHref: (site: MapSitePlatformRecord) => string;
  external?: boolean;
}[] = [
  {
    key: "mls",
    label: "MLS®",
    resolveHref: (site) => site.mls_url?.trim() || TALISPROS_START,
  },
  {
    key: "url",
    label: "URL",
    resolveHref: (site) => site.broker_url?.trim() || TALISPROS_START,
  },
  {
    key: "teb",
    label: "TEB™",
    resolveHref: (site) =>
      site.teb_url?.trim() || ROUTES.TALISBOOKS_LIBRARY,
  },
  {
    key: "ttv",
    label: "TTV™",
    resolveHref: (site) => site.ttv_url?.trim() || TALISPROS_START,
  },
];

function ResourceButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const className =
    "rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-center text-sm font-medium text-neutral-900 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50";

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {label}
    </a>
  );
}

interface MapSitePropertyPopupProps {
  mapsite: MapSitePlatformRecord;
  claimHref: string;
  /** Top offset (px) — lines up with the left listing tile below search. */
  alignTop: number;
  onClose: () => void;
}

export default function MapSitePropertyPopup({
  mapsite,
  claimHref,
  alignTop,
  onClose,
}: MapSitePropertyPopupProps) {
  const claimable = isClaimable(mapsite.status);
  const showActions = showsResourceActions(mapsite.status);
  const heroImage = getMapSiteListingHeroImage(mapsite);
  const photoCount = getMapSiteListingPhotoCount(mapsite);

  return (
    <div
      role="dialog"
      aria-label={mapsite.property_title}
      className={`pointer-events-auto absolute left-1/2 z-30 ${MAPSITE_LISTING_CARD_WIDTH_CLASS} -translate-x-1/2`}
      style={{ top: alignTop }}
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.28)] ring-1 ring-black/5">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-base leading-none text-neutral-700 shadow hover:bg-white"
          aria-label="Close"
        >
          ×
        </button>

        <div
          className={`relative ${MAPSITE_LISTING_HERO_HEIGHT_CLASS} w-full bg-neutral-200`}
        >
          <Image
            src={heroImage}
            alt={mapsite.property_title}
            fill
            className={MAPSITE_LISTING_IMAGE_CLASS}
            sizes="352px"
            unoptimized
          />
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-medium text-white">
            {photoCount} Photo{photoCount === 1 ? "" : "s"}
          </span>
        </div>

        <div className="space-y-3 px-4 pb-4 pt-3">
          <div>
            <h2 className="text-[17px] font-semibold leading-snug text-neutral-900">
              {mapsite.property_title}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">
              {mapsite.property_description ||
                "Welcome to Talispros™. Choose your market and begin onboarding."}
            </p>
          </div>

          {claimable ? (
            <Link
              href={claimHref}
              className="flex w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50"
            >
              Claim a Market
            </Link>
          ) : null}

          {showActions ? (
            <div className="grid grid-cols-2 gap-2">
              {RESOURCES.map((resource) => (
                <ResourceButton
                  key={resource.key}
                  href={resource.resolveHref(mapsite)}
                  label={resource.label}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
