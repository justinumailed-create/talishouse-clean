"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, type ReactNode } from "react";
import type { MapSiteLayoutData } from "@/lib/mapsite-layout";
import { useMapVisitorLocation } from "@/lib/mapsite/use-map-visitor-location";
import type { TalisMapsPin } from "@/lib/talismaps";
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
  variant?: "embedded" | "window";
  backHref?: string | null;
  children?: ReactNode;
}

export default function MapSiteTalisMaps({
  pins,
  mapCenter,
  mapZoom,
  propertyTitle,
  variant = "embedded",
  backHref = null,
  children = null,
}: MapSiteTalisMapsProps) {
  const router = useRouter();
  const openGeneratedEbook = useCallback(
    (pin: TalisMapsPin | null) => {
      const href = pin?.href?.trim();
      if (!href) return;
      if (/^https?:\/\//i.test(href)) {
        window.location.assign(href);
        return;
      }
      router.push(href);
    },
    [router],
  );
  const {
    coordinates: visitorLocation,
    nearbyListings,
    showLocationNotice,
    dismissNotice,
    status,
  } = useMapVisitorLocation({ pins });

  const isWindow = variant === "window";
  const frameClassName = isWindow
    ? "relative h-dvh w-screen overflow-hidden bg-neutral-900"
    : "relative min-h-[300px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm sm:min-h-[440px] md:min-h-[520px]";
  const minHeightClassName = isWindow
    ? "min-h-dvh"
    : "min-h-[300px] sm:min-h-[440px] md:min-h-[520px]";

  const map = (
    <div className={frameClassName}>
      <TalisMapsEmbed
        pins={pins}
        center={mapCenter}
        zoom={mapZoom}
        pinLabel={propertyTitle}
        marketing={pins.length === 0 && !mapCenter}
        visitorLocation={visitorLocation}
        className="absolute inset-0 h-full w-full"
        minHeightClassName={minHeightClassName}
        emptyMessage="Add coordinates or Home PINs to display this property on the map."
        onSelectPin={openGeneratedEbook}
      />
      <MapSiteVisitorLocationOverlay
        hasVisitorLocation={status === "granted" && visitorLocation != null}
        nearbyListings={nearbyListings}
        showLocationNotice={showLocationNotice}
        onDismissNotice={dismissNotice}
      />
      {isWindow && backHref ? (
        <a
          href={backHref}
          className="absolute right-3 top-3 z-[2147483647] inline-flex min-h-10 items-center rounded-xl border border-neutral-200 bg-white/95 px-3 py-2 text-sm font-medium text-neutral-900 shadow-md backdrop-blur transition hover:bg-white sm:right-4 sm:top-4"
        >
          Back to Mapsite™
        </a>
      ) : null}
      {children}
    </div>
  );

  if (isWindow) {
    return map;
  }

  return (
    <section className="bg-[#f8f8f7]">
      <div className="px-4 sm:px-8">{map}</div>
    </section>
  );
}
