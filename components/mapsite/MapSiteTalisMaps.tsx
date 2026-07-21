"use client";

import dynamic from "next/dynamic";
import type { MapSiteLayoutData } from "@/lib/mapsite-layout";
import { useMapVisitorLocation } from "@/lib/mapsite/use-map-visitor-location";
import MapSiteVisitorLocationOverlay from "./MapSiteVisitorLocationOverlay";

const TalisMapsEmbed = dynamic(() => import("@/components/talismaps/TalisMapsEmbed"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 text-sm text-neutral-500">
      Loading map...
    </div>
  ),
});

interface MapSiteTalisMapsProps {
  pins: MapSiteLayoutData["pins"];
  mapCenter: MapSiteLayoutData["mapCenter"];
  mapZoom: MapSiteLayoutData["mapZoom"];
  propertyTitle: string;
}

export default function MapSiteTalisMaps({
  pins,
  mapCenter,
  mapZoom,
  propertyTitle,
}: MapSiteTalisMapsProps) {
  const {
    coordinates: visitorLocation,
    nearbyListings,
    showLocationNotice,
    dismissNotice,
    status,
  } = useMapVisitorLocation({ pins });

  return (
    <section className="bg-[#f8f8f7]">
      <div className="px-4 sm:px-8">
        <div className="relative min-h-[300px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm sm:min-h-[440px] md:min-h-[520px]">
          <TalisMapsEmbed
            pins={pins}
            center={mapCenter}
            zoom={mapZoom}
            pinLabel={propertyTitle}
            marketing={pins.length === 0 && !mapCenter}
            visitorLocation={visitorLocation}
            className="absolute inset-0 h-full w-full"
            minHeightClassName="min-h-[300px] sm:min-h-[440px] md:min-h-[520px]"
            emptyMessage="Add coordinates or Home PINs to display this property on the map."
          />
          <MapSiteVisitorLocationOverlay
            hasVisitorLocation={status === "granted" && visitorLocation != null}
            nearbyListings={nearbyListings}
            showLocationNotice={showLocationNotice}
            onDismissNotice={dismissNotice}
          />
        </div>
      </div>
    </section>
  );
}
