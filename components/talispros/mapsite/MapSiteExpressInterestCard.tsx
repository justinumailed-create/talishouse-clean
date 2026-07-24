"use client";

import MapSiteContactForm from "@/components/mapsite/MapSiteContactForm";
import { MAPSITE_LISTING_CARD_WIDTH_CLASS } from "@/lib/talispros/mapsite-listing-media";

interface MapSiteExpressInterestCardProps {
  fastCode: string;
  propertyTitle: string;
}

export default function MapSiteExpressInterestCard({
  fastCode,
  propertyTitle,
}: MapSiteExpressInterestCardProps) {
  return (
    <div
      className={`pointer-events-auto ${MAPSITE_LISTING_CARD_WIDTH_CLASS} rounded-2xl bg-white/75 shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/5 backdrop-blur-sm`}
    >
      <div className="border-b border-neutral-200/80 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Express an interest
        </p>
        {propertyTitle ? (
          <h3 className="mt-1 text-base font-semibold text-black">
            {propertyTitle}
          </h3>
        ) : null}
        <p className="mt-0.5 text-xs text-neutral-600">FAST Code: {fastCode}</p>
      </div>
      <MapSiteContactForm
        fastCode={fastCode}
        agentName="Talispros™"
        agentEmail=""
        embedded
      />
    </div>
  );
}
