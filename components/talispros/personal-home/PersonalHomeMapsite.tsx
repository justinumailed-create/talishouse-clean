"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MapEngineCanvas from "@/components/talismaps/map-engine/MapEngineCanvas";
import {
  MapEngineProvider,
  useMapEngine,
} from "@/components/talismaps/map-engine/MapEngineProvider";
import MapSitePropertyPopup from "@/components/talispros/mapsite/MapSitePropertyPopup";
import { useT } from "@/lib/i18n/client";
import {
  MAPSITE_PIN_DEFAULT_BORDER,
  MAPSITE_PIN_DEFAULT_ICON,
  resolveMapSitePinStyle,
} from "@/lib/mapsite-pin-style";
import { mapsitePublicPinLabel } from "@/lib/mapsite-pin-label";
import type { MapEnginePin } from "@/lib/talismaps/map-engine";
import { accountTypeForAudience } from "@/lib/talispros/account-capabilities";
import type { MapsiteFlagIdentity } from "@/lib/talispros/flag-identity";
import type { MapSitePlatformRecord } from "@/lib/talispros/mapsite-platform";
import { getMapSiteOnboardingPhase } from "@/lib/talispros/mapsite-onboarding-phase";
import { pinPhaseLabel } from "@/lib/talispros/mapsite-state";
import {
  personalHomeFlagFrame,
  stepPersonalHomeMapZoom,
} from "@/lib/talispros/system-fast-code-gate";
import { systemMapsiteOpeningZoom } from "@/lib/talispros/system-mapsite-zoom";

const ZOOM_BUTTON =
  "inline-flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-900/20 bg-white text-[22px] font-semibold leading-none text-neutral-950 shadow-[0_4px_14px_rgba(0,0,0,0.28)] transition hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#046BD9] disabled:cursor-not-allowed disabled:opacity-40";

function PersonalHomeMapCanvas({
  mapsite,
  pin,
  hasTalisBook,
  claimHref,
}: {
  mapsite: MapSitePlatformRecord;
  pin: MapEnginePin;
  hasTalisBook: boolean;
  claimHref: string;
}) {
  const { personalHome: t } = useT();
  const rootRef = useRef<HTMLDivElement>(null);
  const openedRef = useRef(false);
  const { setViewport, isReady, selectedPinId, setSelectedPinId, viewport } = useMapEngine();
  const [frame, setFrame] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setFrame({ width: rect.width, height: rect.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isReady || openedRef.current) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect || rect.width < 200 || rect.height < 200) return;
    openedRef.current = true;
    setViewport({
      center: { latitude: mapsite.lat, longitude: mapsite.lng },
      zoom: systemMapsiteOpeningZoom(mapsite.lat, Math.min(rect.width, rect.height)),
    });
  }, [frame.height, frame.width, isReady, mapsite.lat, mapsite.lng, setViewport]);

  const open = selectedPinId === mapsite.id;
  const flag = personalHomeFlagFrame(
    frame.width || 640,
    frame.height || 640,
  );
  const phase = getMapSiteOnboardingPhase({
    status: mapsite.status,
    paymentReceived: false,
    hasTalisBook: hasTalisBook || Boolean(mapsite.teb_url || mapsite.teb_own_book_href),
  });

  const zoomBy = (delta: number) => {
    setViewport({
      center: viewport.center,
      zoom: stepPersonalHomeMapZoom(viewport.zoom, delta),
    });
  };

  return (
    <div ref={rootRef} className="relative h-full min-h-[inherit] w-full">
      <MapEngineCanvas className="h-full w-full" />
      <div
        className="absolute right-3 top-3 z-40 flex flex-col gap-1.5"
        data-testid="mapsite-zoom-controls"
        data-zoom={viewport.zoom}
      >
        <button
          type="button"
          className={ZOOM_BUTTON}
          aria-label={t.zoomIn}
          data-testid="mapsite-zoom-in"
          disabled={!isReady || viewport.zoom >= 20}
          onClick={() => zoomBy(1)}
        >
          +
        </button>
        <button
          type="button"
          className={ZOOM_BUTTON}
          aria-label={t.zoomOut}
          data-testid="mapsite-zoom-out"
          disabled={!isReady || viewport.zoom <= 3}
          onClick={() => zoomBy(-1)}
        >
          −
        </button>
      </div>
      {open ? (
        <MapSitePropertyPopup
          mapsite={mapsite}
          claimHref={claimHref}
          claimLabel="Register Account now"
          accountType={accountTypeForAudience("brokers")}
          onboardingPhase={phase}
          talisBookHref={mapsite.teb_own_book_href || mapsite.teb_url}
          canBuyAdditionalPins={false}
          centerX={flag.centerX}
          widthPx={flag.width}
          dense
          onClose={() => setSelectedPinId(null)}
        />
      ) : null}
      <span className="sr-only">{pin.label}</span>
    </div>
  );
}

export default function PersonalHomeMapsite({
  mapsite,
  flagIdentity,
  flagName,
  hasTalisBook,
  claimHref,
}: {
  mapsite: MapSitePlatformRecord;
  flagIdentity: MapsiteFlagIdentity | null;
  flagName: string | null;
  hasTalisBook: boolean;
  claimHref: string;
}) {
  const { personalHome: t } = useT();
  const opening = systemMapsiteOpeningZoom(mapsite.lat);
  const pin = useMemo(() => {
    const savedPin = resolveMapSitePinStyle({
      pinIcon: mapsite.pin_icon,
      pinColor: mapsite.pin_color,
      pinBorder: mapsite.pin_border,
      pinWhiteCenter: mapsite.pin_white_center,
      pinAnimated: mapsite.pin_animated,
      pinCategoryBadge: mapsite.pin_category_badge,
    });
    const label = mapsitePublicPinLabel({
      propertyTitle: mapsite.property_title,
      address: mapsite.property_address,
      fallback: mapsite.fast_code?.trim().toUpperCase() || "Location",
      agentName: flagName,
      flagIdentity,
    });
    const enginePin: MapEnginePin = {
      id: mapsite.id,
      latitude: mapsite.lat,
      longitude: mapsite.lng,
      color: savedPin.pinColor,
      label,
      featured: true,
      metadata: {
        status: mapsite.status,
        phase: pinPhaseLabel(mapsite.status),
        icon: savedPin.pinIcon || MAPSITE_PIN_DEFAULT_ICON,
        border: savedPin.pinBorder || MAPSITE_PIN_DEFAULT_BORDER,
        whiteCenter: savedPin.whiteCenter,
        animated: savedPin.pinAnimated,
        categoryBadge: savedPin.pinCategoryBadge,
      },
    };
    return enginePin;
  }, [flagIdentity, flagName, mapsite]);
  return (
    <div
      className="h-full w-full"
      data-testid="personal-home-mapsite"
      data-map-opening="80km"
      data-fast-code={mapsite.fast_code?.trim().toLowerCase() || ""}
      aria-label={t.mapLabel}
    >
      <MapEngineProvider
        basemapView="satellite"
        initialPins={[pin]}
        initialViewport={{
          center: { latitude: mapsite.lat, longitude: mapsite.lng },
          zoom: opening,
        }}
        interactive
        scrollZoom={false}
        preserveViewport
      >
        <PersonalHomeMapCanvas
          mapsite={mapsite}
          pin={pin}
          hasTalisBook={hasTalisBook}
          claimHref={claimHref}
        />
      </MapEngineProvider>
    </div>
  );
}
