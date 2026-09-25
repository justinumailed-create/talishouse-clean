"use client";

import Link from "next/link";
import type { AllPinsShowcasePin } from "@/lib/talispros/allpins-mapsite";
import {
  MAPSITE_LISTING_CARD_WIDTH_CLASS,
  MAPSITE_LISTING_IMAGE_CLASS,
} from "@/lib/talispros/mapsite-listing-media";
import { MAPSITE_PIN_TIP_CLEARANCE_PX } from "@/lib/talispros/mapsite-overlay-layout";

type Props = {
  pin: AllPinsShowcasePin;
  onClose: () => void;
};

/**
 * Floating pin card for ALLPINS — mirrors claimed Mapsite™ popup chrome
 * (hero + FAST Code + book / Mapsite™ demo actions) without claim/onboarding.
 */
export default function MapSiteAllPinsPinCard({ pin, onClose }: Props) {
  const hero =
    pin.coverImageUrl?.trim() || "/talisbooks/sample/img-11-1280x720.jpeg";
  const fastCode = pin.fastCode.toUpperCase();

  return (
    <div
      role="dialog"
      aria-label={pin.label}
      data-testid="allpins-pin-card"
      className={`pointer-events-none absolute z-30 ${MAPSITE_LISTING_CARD_WIDTH_CLASS} -translate-x-1/2`}
      style={{
        left: "50%",
        top: "auto",
        bottom: `calc(50% + ${MAPSITE_PIN_TIP_CLEARANCE_PX}px)`,
      }}
    >
      <div className="mapsite-popup-card pointer-events-auto flex flex-col overflow-hidden rounded-2xl bg-white/75 shadow-[0_12px_40px_rgba(0,0,0,0.28)] ring-1 ring-black/5 backdrop-blur-sm">
        <div className="mapsite-popup-hero relative h-36 w-full shrink-0 bg-neutral-200/80">
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero}
              alt=""
              className={`h-full w-full ${MAPSITE_LISTING_IMAGE_CLASS}`}
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/50 text-[17px] leading-none text-neutral-700 shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition hover:bg-white/70"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col bg-gradient-to-b from-white/65 to-white/75 px-4 pb-3 pt-1.5">
          <h2 className="m-0 text-[15px] font-semibold leading-tight tracking-tight text-black">
            {pin.label}
          </h2>
          <p className="m-0 text-[11px] font-medium uppercase leading-tight tracking-[0.08em] text-neutral-500">
            FAST Code: {fastCode}
          </p>
          {pin.address ? (
            <p className="m-0 line-clamp-2 text-[12px] leading-tight text-black">
              {pin.address}
            </p>
          ) : null}

          <div className="mt-2 flex shrink-0 gap-2">
            {pin.bookHref ? (
              <Link
                href={pin.bookHref}
                className="inline-flex min-h-9 flex-1 items-center justify-center rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800"
              >
                {pin.bookTitle ? "Open book" : "Open book"}
              </Link>
            ) : null}
            <Link
              href={pin.mapsiteHref}
              className="inline-flex min-h-9 flex-1 items-center justify-center rounded-lg border border-neutral-200/80 bg-white/75 px-3 py-1.5 text-xs font-medium text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] backdrop-blur-sm transition hover:border-neutral-300 hover:bg-white/85"
            >
              Open Mapsite™
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
