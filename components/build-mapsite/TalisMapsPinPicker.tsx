"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import MapEngineCanvas from "@/components/talismaps/map-engine/MapEngineCanvas";
import {
  MapEngineProvider,
  useMapEngine,
} from "@/components/talismaps/map-engine/MapEngineProvider";
import type { MapEnginePin, MapViewport } from "@/lib/talismaps/map-engine";
import { pinStyleCacheKey } from "@/lib/talismaps/map-engine/pin-marker-icon";
import { useTalisMapsMapDefaults } from "@/lib/talismaps/use-map-defaults";
import {
  clampMapZoom,
  formatCoordinate,
  hasValidCoordinates,
  HOME_PIN_DEFAULT_MAP_ZOOM,
} from "@/lib/home-pin-coordinates";

export interface TalisMapsPinPickerPinStyle {
  color?: string | null;
  label?: string | null;
  icon?: string | null;
  border?: string | null;
  whiteCenter?: boolean;
  animated?: boolean;
  categoryBadge?: string | null;
  customLogoUrl?: string | null;
}

export interface TalisMapsPinLocationUpdate {
  latitude: string;
  longitude: string;
  manualPlacement: boolean;
  reverseGeocodedAddress?: string | null;
  mapZoom?: number;
}

export interface TalisMapsPinPickerProps {
  latitude: string;
  longitude: string;
  streetAddress: string;
  /** When true, the PIN was placed on the map — address edits should not move it. */
  manualPlacement?: boolean;
  /** Increment to force a forward-geocode of streetAddress (e.g. Enter key). */
  addressLookupNonce?: number;
  /** Last zoom chosen by the user on this preview (preserved across pin moves). */
  mapZoom?: number;
  pinStyle?: TalisMapsPinPickerPinStyle;
  onLocationChange: (update: TalisMapsPinLocationUpdate) => void;
  /** Fired when the user zooms the preview (scroll / controls). */
  onMapZoomChange?: (zoom: number) => void;
}

const HOME_PIN_ID = "home-pin";
const DEFAULT_VIEWPORT: MapViewport = {
  center: { latitude: 43.6532, longitude: -79.3832 },
  zoom: HOME_PIN_DEFAULT_MAP_ZOOM,
};

function buildHomePin(
  latitude: string,
  longitude: string,
  pinStyle: TalisMapsPinPickerPinStyle = {}
): MapEnginePin | null {
  if (!hasValidCoordinates(latitude, longitude)) {
    return null;
  }

  return {
    id: HOME_PIN_ID,
    latitude: Number.parseFloat(latitude),
    longitude: Number.parseFloat(longitude),
    label: pinStyle.label?.trim() || undefined,
    color: pinStyle.color?.trim() || "#1C1C1E",
    featured: true,
    metadata: {
      icon: pinStyle.icon || "dot",
      border: pinStyle.border || "none",
      whiteCenter: pinStyle.whiteCenter !== false,
      animated: Boolean(pinStyle.animated),
      categoryBadge: pinStyle.categoryBadge || null,
      customLogoUrl: pinStyle.customLogoUrl || null,
    },
  };
}

async function reverseGeocodeAddress(
  latitude: string,
  longitude: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `/api/talismaps/geocode?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      found?: boolean;
      address?: string | null;
    };
    if (!payload.found || !payload.address?.trim()) return null;
    return payload.address.trim();
  } catch {
    return null;
  }
}

function PinPickerViewportSync({
  latitude,
  longitude,
  mapZoom,
}: {
  latitude: string;
  longitude: string;
  mapZoom: number;
}) {
  const { setViewport, viewport, isReady } = useMapEngine();
  const lastSyncedCoordKeyRef = useRef("");

  useEffect(() => {
    if (!isReady || !hasValidCoordinates(latitude, longitude)) return;

    const coordKey = `${latitude},${longitude}`;
    if (coordKey === lastSyncedCoordKeyRef.current) return;
    lastSyncedCoordKeyRef.current = coordKey;

    // Re-center only — keep the user's zoom (never force a zoom-out on pin move).
    setViewport({
      center: {
        latitude: Number.parseFloat(latitude),
        longitude: Number.parseFloat(longitude),
      },
      zoom: clampMapZoom(viewport.zoom || mapZoom),
    });
  }, [isReady, latitude, longitude, mapZoom, viewport.zoom, setViewport]);

  return null;
}

function PinPickerZoomReporter({
  onZoomChange,
}: {
  onZoomChange: (zoom: number) => void;
}) {
  const { viewport, isReady } = useMapEngine();
  const lastZoomRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isReady) return;
    const zoom = clampMapZoom(viewport.zoom);
    if (lastZoomRef.current === zoom) return;
    lastZoomRef.current = zoom;
    onZoomChange(zoom);
  }, [isReady, viewport.zoom, onZoomChange]);

  return null;
}

function TalisMapsPinPickerMap({
  latitude,
  longitude,
  streetAddress,
  manualPlacement = false,
  addressLookupNonce = 0,
  mapZoom = HOME_PIN_DEFAULT_MAP_ZOOM,
  pinStyle,
  onLocationChange,
  onMapZoomChange,
}: TalisMapsPinPickerProps) {
  const skipGeocodeRef = useRef(false);
  const lastGeocodedAddressRef = useRef("");
  const lastLookupNonceRef = useRef(0);
  const lastReverseKeyRef = useRef("");
  const onLocationChangeRef = useRef(onLocationChange);
  const onMapZoomChangeRef = useRef(onMapZoomChange);
  const isPinDraggingRef = useRef(false);
  const mapZoomRef = useRef(mapZoom);
  const defaults = useTalisMapsMapDefaults({
    // Match MapSite: Google satellite for claim / Home PIN placement.
    providerId: "google-maps",
    basemapView: "satellite",
  });

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    onMapZoomChangeRef.current = onMapZoomChange;
  }, [onMapZoomChange]);

  useEffect(() => {
    mapZoomRef.current = mapZoom;
  }, [mapZoom]);

  const reportZoom = useCallback((zoom: number) => {
    const next = clampMapZoom(zoom);
    if (next === mapZoomRef.current) return;
    mapZoomRef.current = next;
    onMapZoomChangeRef.current?.(next);
  }, []);

  const applyManualCoordinates = useCallback(
    async (nextLatitude: string, nextLongitude: string) => {
      skipGeocodeRef.current = true;
      onLocationChangeRef.current({
        latitude: nextLatitude,
        longitude: nextLongitude,
        manualPlacement: true,
        mapZoom: mapZoomRef.current,
      });

      const reverseKey = `${nextLatitude},${nextLongitude}`;
      if (reverseKey === lastReverseKeyRef.current) return;
      lastReverseKeyRef.current = reverseKey;

      const resolved = await reverseGeocodeAddress(nextLatitude, nextLongitude);
      onLocationChangeRef.current({
        latitude: nextLatitude,
        longitude: nextLongitude,
        manualPlacement: true,
        reverseGeocodedAddress: resolved,
        mapZoom: mapZoomRef.current,
      });
    },
    []
  );

  const handlePinDrag = useCallback(
    (pinId: string, coordinates: { latitude: number; longitude: number }) => {
      if (pinId !== HOME_PIN_ID) return;
      isPinDraggingRef.current = false;
      void applyManualCoordinates(
        formatCoordinate(String(coordinates.latitude)),
        formatCoordinate(String(coordinates.longitude))
      );
    },
    [applyManualCoordinates]
  );

  const handlePinDragStart = useCallback((pinId: string) => {
    if (pinId === HOME_PIN_ID) {
      isPinDraggingRef.current = true;
    }
  }, []);

  const handleMapClick = useCallback(
    (coordinates: { latitude: number; longitude: number }) => {
      void applyManualCoordinates(
        formatCoordinate(String(coordinates.latitude)),
        formatCoordinate(String(coordinates.longitude))
      );
    },
    [applyManualCoordinates]
  );

  const initialViewport = useMemo<MapViewport>(() => {
    if (hasValidCoordinates(latitude, longitude)) {
      return {
        center: {
          latitude: Number.parseFloat(latitude),
          longitude: Number.parseFloat(longitude),
        },
        zoom: clampMapZoom(mapZoom),
      };
    }
    return DEFAULT_VIEWPORT;
  }, [latitude, longitude, mapZoom]);

  const enginePin = useMemo(
    () => buildHomePin(latitude, longitude, pinStyle),
    [latitude, longitude, pinStyle]
  );

  const pins = useMemo(() => (enginePin ? [enginePin] : []), [enginePin]);
  const draggablePinIds = useMemo(
    () => (enginePin ? [HOME_PIN_ID] : []),
    [enginePin]
  );

  // Street address → forward geocode into coordinates (unless PIN was placed manually).
  // addressLookupNonce forces an immediate refresh (Enter on the address field).
  useEffect(() => {
    const address = streetAddress.trim();
    if (!address) return;

    const forced =
      addressLookupNonce > 0 &&
      addressLookupNonce !== lastLookupNonceRef.current;

    if (forced) {
      lastLookupNonceRef.current = addressLookupNonce;
      lastGeocodedAddressRef.current = "";
      skipGeocodeRef.current = false;
    } else if (manualPlacement) {
      return;
    }

    if (skipGeocodeRef.current) {
      skipGeocodeRef.current = false;
      return;
    }
    if (isPinDraggingRef.current) return;
    if (!forced && address === lastGeocodedAddressRef.current) return;

    const timeout = window.setTimeout(
      async () => {
        try {
          const response = await fetch(
            `/api/talismaps/geocode?q=${encodeURIComponent(address)}`
          );
          if (!response.ok) return;

          const payload = (await response.json()) as {
            found?: boolean;
            latitude?: string;
            longitude?: string;
            address?: string | null;
          };

          if (!payload.found || !payload.latitude || !payload.longitude) return;

          lastGeocodedAddressRef.current = address;
          skipGeocodeRef.current = true;
          lastReverseKeyRef.current = `${payload.latitude},${payload.longitude}`;
          onLocationChangeRef.current({
            latitude: formatCoordinate(payload.latitude),
            longitude: formatCoordinate(payload.longitude),
            manualPlacement: false,
            reverseGeocodedAddress: payload.address?.trim() || null,
            mapZoom: mapZoomRef.current,
          });
        } catch {
          // Geocoding is best-effort; users can still place the pin on the map.
        }
      },
      forced ? 0 : 600
    );

    return () => window.clearTimeout(timeout);
  }, [streetAddress, manualPlacement, addressLookupNonce]);

  return (
    <div className="h-full w-full touch-none">
      <MapEngineProvider
        providerId={defaults.providerId}
        basemapView={defaults.basemapView}
        initialPins={pins}
        initialViewport={initialViewport}
        draggablePinIds={draggablePinIds}
        onPinDrag={handlePinDrag}
        onPinDragStart={handlePinDragStart}
        onMapClick={handleMapClick}
      >
        <PinPickerViewportSync
          latitude={latitude}
          longitude={longitude}
          mapZoom={mapZoom}
        />
        <PinPickerZoomReporter onZoomChange={reportZoom} />
        <MapEngineCanvas className="h-full w-full touch-none" />
      </MapEngineProvider>
    </div>
  );
}

export default function TalisMapsPinPicker({
  pinStyle,
  ...props
}: TalisMapsPinPickerProps) {
  const stablePinStyle = useMemo(
    () => ({
      color: pinStyle?.color ?? null,
      label: pinStyle?.label ?? null,
      icon: pinStyle?.icon ?? null,
      border: pinStyle?.border ?? null,
      whiteCenter: pinStyle?.whiteCenter ?? false,
      animated: pinStyle?.animated ?? false,
      categoryBadge: pinStyle?.categoryBadge ?? null,
      customLogoUrl: pinStyle?.customLogoUrl ?? null,
    }),
    [
      pinStyle?.color,
      pinStyle?.label,
      pinStyle?.icon,
      pinStyle?.border,
      pinStyle?.whiteCenter,
      pinStyle?.animated,
      pinStyle?.categoryBadge,
      pinStyle?.customLogoUrl,
    ]
  );

  return (
    <div className="relative h-[280px] w-full touch-none rounded-xl border border-neutral-200 sm:h-[320px]">
      <TalisMapsPinPickerMap {...props} pinStyle={stablePinStyle} />
      {!hasValidCoordinates(props.latitude, props.longitude) ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/95 to-transparent px-4 pb-3 pt-8 text-center text-xs text-neutral-500">
          Click the map to place a PIN, paste coordinates, or enter an optional
          address.
        </div>
      ) : null}
    </div>
  );
}

export function pinsAreEquivalent(left: MapEnginePin[], right: MapEnginePin[]): boolean {
  if (left.length !== right.length) return false;
  return left.every(
    (pin, index) =>
      pin.id === right[index]?.id &&
      pin.latitude === right[index]?.latitude &&
      pin.longitude === right[index]?.longitude &&
      pinStyleCacheKey(pin, false) === pinStyleCacheKey(right[index]!, false)
  );
}
