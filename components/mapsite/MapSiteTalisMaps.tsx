"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, type ReactNode } from "react";
import type { MapSiteLayoutData } from "@/lib/mapsite-layout";
import type { TalisMapsPin } from "@/lib/talismaps";
import MapSitePublishedMapFrame from "./MapSitePublishedMapOverlay";
import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";

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
  pinLabel: string;
  fastCode: string;
  variant?: "embedded" | "window";
  children?: ReactNode;
}

export default function MapSiteTalisMaps({
  pins,
  mapCenter,
  mapZoom,
  pinLabel,
  fastCode,
  variant = "embedded",
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

  const isWindow = variant === "window";
  // Window: map fills the space under the blue navbar (flex-1), never under it.
  const frameClassName = isWindow
    ? "relative isolate min-h-0 w-full flex-1 overflow-hidden bg-neutral-900"
    : "relative min-h-[300px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm sm:min-h-[440px] md:min-h-[520px]";
  const minHeightClassName = isWindow
    ? "min-h-0"
    : "min-h-[300px] sm:min-h-[440px] md:min-h-[520px]";

  const mapEmbed = (
    <TalisMapsEmbed
      pins={pins}
      center={mapCenter}
      zoom={mapZoom}
      pinLabel={pinLabel}
      marketing={pins.length === 0 && !mapCenter}
      className="absolute inset-0 h-full w-full"
      minHeightClassName={minHeightClassName}
      emptyMessage="Add coordinates or Home PINs to display this property on the map."
      onSelectPin={openGeneratedEbook}
      preserveViewport
      interactive={isWindow}
      lockCenter={!isWindow}
    />
  );

  // Full-screen window: blue TalisU navbar on top (navigation), map below it.
  // `isolate` keeps map pane z-indexes below the navbar dropdowns; any pin card
  // positioned inside the frame starts at the navbar seam, never under it.
  const map = isWindow ? (
    <div className="flex h-dvh w-screen flex-col overflow-hidden bg-neutral-900">
      <TalisUMktsHeader />
      <div className={frameClassName} data-testid="mapsite-window-map">
        {mapEmbed}
        {children}
      </div>
    </div>
  ) : (
    <MapSitePublishedMapFrame
      fastCode={fastCode}
      className={frameClassName}
      mapZoom={mapZoom}
    >
      {mapEmbed}
      {children}
    </MapSitePublishedMapFrame>
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
