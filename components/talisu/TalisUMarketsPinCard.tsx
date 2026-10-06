"use client";

import Link from "next/link";
import type { TalisUMktsPin } from "@/lib/talisu/markets-pins";
import { MAPSITE_PIN_TIP_CLEARANCE_PX } from "@/lib/talispros/mapsite-overlay-layout";
import { useT } from "@/lib/i18n/client";

type Props = {
  pin: TalisUMktsPin;
  onClose: () => void;
};

/**
 * Atlist-style pin modal: hero image, title, claim copy, Next Step… → Demo.
 */
export default function TalisUMarketsPinCard({ pin, onClose }: Props) {
  const t = useT();
  return (
    <div
      role="dialog"
      aria-label={pin.label}
      data-testid="talisu-mkts-pin-card"
      className="pointer-events-none absolute left-1/2 z-30 w-[min(92vw,20rem)] -translate-x-1/2"
      style={{
        top: "auto",
        bottom: `calc(50% + ${MAPSITE_PIN_TIP_CLEARANCE_PX}px)`,
      }}
    >
      <div className="pointer-events-auto flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.28)] ring-1 ring-black/5">
        {pin.heroImageUrl ? (
          <div className="relative h-36 w-full shrink-0 bg-neutral-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pin.heroImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-[17px] leading-none text-neutral-700 shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition hover:bg-white"
              aria-label={t.markets.close}
            >
              ×
            </button>
          </div>
        ) : (
          <div className="relative flex items-center justify-end border-b border-neutral-100 px-3 py-2">
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-[17px] text-neutral-700 hover:bg-neutral-200"
              aria-label={t.markets.close}
            >
              ×
            </button>
          </div>
        )}

        <div className="flex flex-col px-4 pb-3.5 pt-2.5">
          <h2 className="m-0 text-[16px] font-semibold leading-tight tracking-tight text-neutral-950">
            {pin.label}
          </h2>
          <p className="mt-1.5 text-[13px] leading-snug text-neutral-700">
            {pin.description}
          </p>
          <Link
            href={pin.nextHref}
            className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-[#0069CF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#145de3]"
          >
            {pin.nextLabel}
          </Link>
        </div>
      </div>

      <div
        className="pointer-events-none mx-auto -mt-px h-0 w-0 border-l-[11px] border-r-[11px] border-t-[12px] border-l-transparent border-r-transparent border-t-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.12)]"
        aria-hidden
      />
    </div>
  );
}
