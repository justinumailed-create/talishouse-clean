"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MapEngineCanvas from "@/components/talismaps/map-engine/MapEngineCanvas";
import { MapEngineProvider } from "@/components/talismaps/map-engine/MapEngineProvider";
import type { MapEnginePin } from "@/lib/talismaps/map-engine";
import type { RegistrationMarket } from "@/lib/registration-market";
import { isMapSitePaid } from "@/lib/talispros/mapsite-audience";
import type { MapSitePlatformRecord } from "@/lib/talispros/mapsite-platform";
import { MAPSITE_LISTING_TILE_TOP_FALLBACK_PX } from "@/lib/talispros/mapsite-listing-media";
import {
  isClaimable,
  MAPSITE_APP_PATH,
  pinPhaseLabel,
  showsResourceActions,
} from "@/lib/talispros/mapsite-state";
import MapSiteExpressInterestCard from "./MapSiteExpressInterestCard";
import MapSiteListingSidebar from "./MapSiteListingSidebar";
import MapSitePaymentCard from "./MapSitePaymentCard";
import MapSitePropertyPopup from "./MapSitePropertyPopup";

const PIN_COLORS: Record<string, string> = {
  UNCLAIMED: "#1A73E8",
  PENDING: "#1A73E8",
  ACTIVE: "#1A73E8",
  ARCHIVED: "#9CA3AF",
};

/** Keep card bottoms above map-center so the tip clears the pin body. */
const PIN_TIP_CLEARANCE_PX = 40;
const MIN_CARD_HEIGHT_PX = 148;
const COLLAPSED_CARD_HEIGHT_PX = 48;

interface MapSiteApplicationProps {
  initialMapSite: MapSitePlatformRecord;
  audience: RegistrationMarket;
  requestId?: string | null;
  openPinOnLoad?: boolean;
}

export default function MapSiteApplication({
  initialMapSite,
  audience,
  requestId = null,
  openPinOnLoad = false,
}: MapSiteApplicationProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listingCardRef = useRef<HTMLDivElement>(null);
  const [mapsite] = useState(initialMapSite);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(
    openPinOnLoad ? initialMapSite.id : null
  );
  const [collapsed, setCollapsed] = useState(false);
  const [alignTop, setAlignTop] = useState(MAPSITE_LISTING_TILE_TOP_FALLBACK_PX);
  /** Expanded height shared with the property popup — never shrinks when FAST card collapses. */
  const [expandedCardHeight, setExpandedCardHeight] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (openPinOnLoad) {
      setSelectedPinId(mapsite.id);
    }
  }, [openPinOnLoad, mapsite.id]);

  // Property popup height tracks the *expanded* FAST card height (tip above pin).
  // Collapsing the FAST card does not change the property card.
  useEffect(() => {
    const root = rootRef.current;
    const card = listingCardRef.current;
    if (!root || !card) return;

    const syncLayout = () => {
      const rootRect = root.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const top = Math.max(0, Math.round(cardRect.top - rootRect.top));
      const tipY = Math.round(rootRect.height / 2 - PIN_TIP_CLEARANCE_PX);
      const height = Math.max(MIN_CARD_HEIGHT_PX, tipY - top);

      setAlignTop(top);
      setExpandedCardHeight(height);
    };

    syncLayout();

    const observer = new ResizeObserver(syncLayout);
    observer.observe(root);
    observer.observe(card);
    window.addEventListener("resize", syncLayout);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncLayout);
    };
  }, [mapsite.status, mapsite.fast_code, mapsite.property_title]);

  const listingCardHeight = collapsed
    ? COLLAPSED_CARD_HEIGHT_PX
    : expandedCardHeight;
  const phase = pinPhaseLabel(mapsite.status);
  const pinColor = PIN_COLORS[phase] ?? PIN_COLORS.UNCLAIMED;
  const claimed = !isClaimable(mapsite.status);
  const paid = isMapSitePaid(mapsite.status);

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
          icon: mapsite.pin_icon || "home",
          whiteCenter: mapsite.pin_white_center ?? false,
        },
      },
    ],
    [mapsite, pinColor, phase]
  );

  const viewport = useMemo(
    () => ({
      center: { latitude: mapsite.lat, longitude: mapsite.lng },
      zoom: 16,
    }),
    [mapsite.lat, mapsite.lng]
  );

  const belowCard =
    claimed && paid && mapsite.fast_code ? (
      <MapSiteExpressInterestCard
        fastCode={mapsite.fast_code}
        propertyTitle={mapsite.property_title}
      />
    ) : claimed && showsResourceActions(mapsite.status) ? (
      <MapSitePaymentCard
        audience={audience}
        mapsiteId={mapsite.id}
        fastCode={mapsite.fast_code}
        requestId={requestId}
      />
    ) : null;

  return (
    <div
      ref={rootRef}
      className="relative h-dvh w-screen overflow-hidden bg-neutral-900"
    >
      <MapEngineProvider
        key={`${mapsite.lat.toFixed(6)}-${mapsite.lng.toFixed(6)}`}
        providerId="google-maps"
        initialPins={pins}
        initialViewport={viewport}
        selectedPinId={selectedPinId}
        onPinSelect={setSelectedPinId}
        onMapClick={() => setSelectedPinId(null)}
        basemapView="satellite"
        lockCenter
      >
        <MapEngineCanvas className="h-full w-full" />
      </MapEngineProvider>

      <MapSiteListingSidebar
        mapsite={mapsite}
        listingCardRef={listingCardRef}
        cardHeight={listingCardHeight}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
        onSelectListing={() => setSelectedPinId(mapsite.id)}
        belowCard={belowCard}
      />

      {selectedPinId === mapsite.id ? (
        <MapSitePropertyPopup
          mapsite={mapsite}
          claimHref={claimHref}
          alignTop={alignTop}
          cardHeight={expandedCardHeight}
          onClose={() => setSelectedPinId(null)}
        />
      ) : null}
    </div>
  );
}
