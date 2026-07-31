"use client";

import Link from "next/link";
import type { PmcRegionalPin } from "@/lib/talispros/pmc-regional-pins";
import { pmcPinEntryWorkflow, pmcPinMarketType } from "@/lib/talispros/pmc-regional-pins";
import {
  MAPSITE_MIN_CARD_HEIGHT_PX,
  MAPSITE_PIN_TIP_CLEARANCE_PX,
  MAPSITE_POPUP_TIP_HEIGHT_PX,
} from "@/lib/talispros/mapsite-overlay-layout";

interface MapSitePmcPinPopupProps {
  pin: PmcRegionalPin;
  actionHref: string;
  rootHeight: number;
  onClose: () => void;
}

export default function MapSitePmcPinPopup({
  pin,
  actionHref,
  rootHeight,
  onClose,
}: MapSitePmcPinPopupProps) {
  const isCorporate = pmcPinMarketType(pin) === "corporate";
  const opensCorporateAdminAuth =
    pmcPinEntryWorkflow(pin) === "corporate-admin-auth";
  const actionLabel = opensCorporateAdminAuth
    ? "Corporate Admin Sign In"
    : isCorporate
      ? "Apply for this corporate market"
      : "Claim this market";
  const tipPointY = Math.round(rootHeight / 2 - MAPSITE_PIN_TIP_CLEARANCE_PX);
  const cardBottom = tipPointY - MAPSITE_POPUP_TIP_HEIGHT_PX;
  const top = Math.max(12, cardBottom - 220);
  const height = Math.max(MAPSITE_MIN_CARD_HEIGHT_PX, cardBottom - top);

  return (
    <div
      role="dialog"
      aria-label={pin.label}
      className="pointer-events-none absolute left-1/2 z-30 w-[min(92vw,20rem)] -translate-x-1/2"
      style={{ top }}
    >
      <div
        className="pointer-events-auto flex flex-col overflow-hidden rounded-2xl bg-white/90 shadow-[0_12px_40px_rgba(0,0,0,0.28)] ring-1 ring-black/5 backdrop-blur-sm"
        style={{ height }}
      >
        <div className="relative flex items-center gap-3 border-b border-neutral-200/70 px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pin.logoUrl}
            alt=""
            className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              {isCorporate ? "Corporate Market™" : "Root Account™"}
            </p>
            <h2 className="truncate text-[15px] font-semibold text-neutral-950">
              {pin.label}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-[17px] text-neutral-700 hover:bg-neutral-200"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
          <p className="text-[12.5px] leading-relaxed text-neutral-700">
            {pin.description}
          </p>
          <Link
            href={actionHref}
            className="mt-auto flex min-h-11 w-full items-center justify-center rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            {actionLabel}
          </Link>
        </div>
      </div>

      <div
        className="pointer-events-none mx-auto -mt-px h-0 w-0 border-l-[11px] border-r-[11px] border-t-[12px] border-l-transparent border-r-transparent border-t-white/90 drop-shadow-[0_2px_2px_rgba(0,0,0,0.12)]"
        aria-hidden
      />
    </div>
  );
}
