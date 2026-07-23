"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MapEngineCanvas from "@/components/talismaps/map-engine/MapEngineCanvas";
import { MapEngineProvider } from "@/components/talismaps/map-engine/MapEngineProvider";
import type { MapEnginePin } from "@/lib/talismaps/map-engine";
import type { RegistrationMarket } from "@/lib/registration-market";
import type { MapSitePlatformRecord } from "@/lib/talispros/mapsite-platform";
import { MAPSITE_LISTING_TILE_TOP_FALLBACK_PX } from "@/lib/talispros/mapsite-listing-media";
import { MAPSITE_APP_PATH, pinPhaseLabel } from "@/lib/talispros/mapsite-state";
import MapSiteListingSidebar from "./MapSiteListingSidebar";
import MapSitePropertyPopup from "./MapSitePropertyPopup";

const PIN_COLORS: Record<string, string> = {
  UNCLAIMED: "#1A73E8",
  PENDING: "#1A73E8",
  ACTIVE: "#1A73E8",
  ARCHIVED: "#9CA3AF",
};

interface MapSiteApplicationProps {
  initialMapSite: MapSitePlatformRecord;
  audience: RegistrationMarket;
  openPinOnLoad?: boolean;
}

export default function MapSiteApplication({
  initialMapSite,
  audience,
  openPinOnLoad = false,
}: MapSiteApplicationProps) {
  const [mapsite] = useState(initialMapSite);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(
    openPinOnLoad ? initialMapSite.id : null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const listingCardRef = useRef<HTMLButtonElement>(null);
  const [listingTileTop, setListingTileTop] = useState(
    MAPSITE_LISTING_TILE_TOP_FALLBACK_PX
  );

  useEffect(() => {
    if (openPinOnLoad) {
      setSelectedPinId(mapsite.id);
    }
  }, [openPinOnLoad, mapsite.id]);

  useEffect(() => {
    function syncListingTileTop() {
      const container = containerRef.current;
      const listingCard = listingCardRef.current;
      if (!container || !listingCard) return;

      const containerTop = container.getBoundingClientRect().top;
      const cardTop = listingCard.getBoundingClientRect().top;
      setListingTileTop(Math.round(cardTop - containerTop));
    }

    syncListingTileTop();

    const listingCard = listingCardRef.current;
    let observer: ResizeObserver | null = null;
    if (listingCard && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(syncListingTileTop);
      observer.observe(listingCard);
    }

    window.addEventListener("resize", syncListingTileTop);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", syncListingTileTop);
    };
  }, [selectedPinId]);

  const phase = pinPhaseLabel(mapsite.status);
  const pinColor = PIN_COLORS[phase] ?? PIN_COLORS.UNCLAIMED;

  const claimHref = useMemo(() => {
    const params = new URLSearchParams({
      mapsiteId: mapsite.id,
      audience,
      returnTo: MAPSITE_APP_PATH,
    });
    return `/talispros/markets/claim-a-market?${params.toString()}`;
  }, [mapsite.id, audience]);

  const pins: MapEnginePin[] = useMemo(
    () => [
      {
        id: mapsite.id,
        latitude: mapsite.lat,
        longitude: mapsite.lng,
        color: mapsite.pin_color || pinColor,
        featured: true,
        metadata: {
          status: mapsite.status,
          phase,
          icon: mapsite.pin_icon || "flag",
          whiteCenter: mapsite.pin_white_center ?? false,
        },
      },
    ],
    [mapsite, pinColor, phase]
  );

  const viewport = useMemo(
    () => ({
      center: { latitude: mapsite.lat, longitude: mapsite.lng },
      // z16 is within MapTiler satellite-v2 / hybrid aerial detail for this market.
      zoom: 16,
    }),
    [mapsite.lat, mapsite.lng]
  );

  return (
    <div ref={containerRef} className="relative h-dvh w-screen overflow-hidden bg-neutral-900">
      <MapEngineProvider
        key={`${mapsite.lat.toFixed(6)}-${mapsite.lng.toFixed(6)}`}
        providerId="google-maps"
        initialPins={pins}
        initialViewport={viewport}
        selectedPinId={selectedPinId}
        onPinSelect={setSelectedPinId}
        onMapClick={() => setSelectedPinId(null)}
        basemapView="satellite"
      >
        <MapEngineCanvas className="h-full w-full" />
      </MapEngineProvider>

      <MapSiteListingSidebar
        mapsite={mapsite}
        listingCardRef={listingCardRef}
        onSelectListing={() => setSelectedPinId(mapsite.id)}
      />

      {selectedPinId === mapsite.id ? (
        <MapSitePropertyPopup
          mapsite={mapsite}
          claimHref={claimHref}
          alignTop={listingTileTop}
          onClose={() => setSelectedPinId(null)}
        />
      ) : null}
    </div>
  );
}
