"use client";

import { useMemo } from "react";
import type { TalisMapsPin } from "@/lib/talismaps";
import {
  TALISMAPS_DEFAULT_VIEWPORT,
  TALISMAPS_MARKETING_VIEWPORT,
} from "@/lib/talismaps/embed";
import { toMapEnginePins } from "@/lib/talismaps/map-engine";
import type { MapCoordinates, MapEnginePin, MapViewport } from "@/lib/talismaps/map-engine";
import { VISITOR_LOCATION_PIN_ID } from "@/lib/mapsite/visitor-location";
import { useTalisMapsMapDefaults } from "@/lib/talismaps/use-map-defaults";
import MapEngineCanvas from "./map-engine/MapEngineCanvas";
import MapEngineFitBounds from "./map-engine/MapEngineFitBounds";
import { MapEngineProvider } from "./map-engine/MapEngineProvider";

export interface TalisMapsEmbedProps {
  pins?: TalisMapsPin[];
  latitude?: number | null;
  longitude?: number | null;
  center?: [number, number];
  zoom?: number;
  className?: string;
  minHeightClassName?: string;
  emptyMessage?: string;
  marketing?: boolean;
  selectedPinId?: string | null;
  onSelectPin?: (pin: TalisMapsPin | null) => void;
  pinLabel?: string;
  visitorLocation?: MapCoordinates | null;
}

const DEFAULT_PIN_COLOR = "#6B7280";

function hasFiniteCoordinate(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value);
}

function buildCoordinatePin(
  latitude: number,
  longitude: number,
  label: string
): TalisMapsPin {
  return {
    id: "embed-pin",
    name: label,
    description: "",
    categoryId: null,
    categorySlug: null,
    categoryName: null,
    categoryColor: DEFAULT_PIN_COLOR,
    latitude,
    longitude,
    address: "",
    city: "",
    province: "",
    postalCode: "",
    country: "",
    website: "",
    phone: "",
    email: "",
    featured: true,
    sortOrder: 0,
  };
}

function resolvePins({
  pins,
  latitude,
  longitude,
  pinLabel,
}: Pick<
  TalisMapsEmbedProps,
  "pins" | "latitude" | "longitude" | "pinLabel"
>): TalisMapsPin[] {
  if (pins && pins.length > 0) {
    return pins;
  }

  if (hasFiniteCoordinate(latitude) && hasFiniteCoordinate(longitude)) {
    return [buildCoordinatePin(latitude, longitude, pinLabel || "Location")];
  }

  return [];
}

function resolveViewport({
  pins,
  center,
  zoom,
  marketing,
}: {
  pins: TalisMapsPin[];
  center?: [number, number];
  zoom?: number;
  marketing?: boolean;
}): MapViewport {
  if (center) {
    return {
      center: { latitude: center[0], longitude: center[1] },
      zoom: zoom ?? TALISMAPS_DEFAULT_VIEWPORT.zoom,
    };
  }

  if (pins.length === 1) {
    return {
      center: {
        latitude: pins[0].latitude,
        longitude: pins[0].longitude,
      },
      zoom: zoom ?? 15,
    };
  }

  if (pins.length > 1) {
    return {
      center: {
        latitude:
          pins.reduce((sum, pin) => sum + pin.latitude, 0) / pins.length,
        longitude:
          pins.reduce((sum, pin) => sum + pin.longitude, 0) / pins.length,
      },
      zoom: zoom ?? 12,
    };
  }

  return marketing ? TALISMAPS_MARKETING_VIEWPORT : TALISMAPS_DEFAULT_VIEWPORT;
}

function buildVisitorEnginePin(coordinates: MapCoordinates): MapEnginePin {
  return {
    id: VISITOR_LOCATION_PIN_ID,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    label: "Your Location",
    color: "#2563EB",
    featured: false,
    metadata: {
      icon: "map-pin",
      whiteCenter: true,
      isVisitorLocation: true,
    },
  };
}

function TalisMapsEmbedMap({
  pins: pinsProp,
  latitude,
  longitude,
  center,
  zoom,
  marketing = false,
  selectedPinId = null,
  onSelectPin,
  pinLabel,
  visitorLocation = null,
}: TalisMapsEmbedProps) {
  const pins = useMemo(
    () =>
      resolvePins({
        pins: pinsProp,
        latitude,
        longitude,
        pinLabel,
      }),
    [pinsProp, latitude, longitude, pinLabel]
  );

  const enginePins = useMemo(() => {
    const propertyPins = toMapEnginePins(pins);
    if (!visitorLocation) return propertyPins;
    return [...propertyPins, buildVisitorEnginePin(visitorLocation)];
  }, [pins, visitorLocation]);

  const fitCoordinates = useMemo(() => {
    const coordinates = pins.map((pin) => ({
      latitude: pin.latitude,
      longitude: pin.longitude,
    }));
    if (visitorLocation) {
      coordinates.push(visitorLocation);
    }
    return coordinates;
  }, [pins, visitorLocation]);
  const defaults = useTalisMapsMapDefaults();

  const initialViewport = useMemo(
    () =>
      resolveViewport({
        pins,
        center,
        zoom,
        marketing,
      }),
    [pins, center, zoom, marketing]
  );

  return (
    <MapEngineProvider
      providerId={defaults.providerId}
      basemapView={defaults.basemapView}
      initialPins={enginePins}
      initialViewport={initialViewport}
      selectedPinId={selectedPinId}
      onPinSelect={(pinId) => {
        if (!onSelectPin) return;
        if (!pinId) {
          onSelectPin(null);
          return;
        }
        onSelectPin(pins.find((pin) => pin.id === pinId) ?? null);
      }}
    >
      {visitorLocation && fitCoordinates.length > 0 ? (
        <MapEngineFitBounds coordinates={fitCoordinates} />
      ) : null}
      <MapEngineCanvas className="h-full w-full" />
    </MapEngineProvider>
  );
}

export default function TalisMapsEmbed({
  className = "relative w-full h-full",
  minHeightClassName = "min-h-[300px]",
  emptyMessage,
  pins: pinsProp,
  latitude,
  longitude,
  center,
  marketing = false,
  ...mapProps
}: TalisMapsEmbedProps) {
  const hasMapContent = useMemo(() => {
    if (pinsProp && pinsProp.length > 0) return true;
    if (hasFiniteCoordinate(latitude) && hasFiniteCoordinate(longitude)) {
      return true;
    }
    if (center) return true;
    if (marketing) return true;
    return false;
  }, [pinsProp, latitude, longitude, center, marketing]);

  if (!hasMapContent && emptyMessage) {
    return (
      <div
        className={`${className} ${minHeightClassName} flex items-center justify-center bg-neutral-50 px-6 text-center text-sm text-neutral-500`}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`${className} ${minHeightClassName}`}>
      <TalisMapsEmbedMap
        pins={pinsProp}
        latitude={latitude}
        longitude={longitude}
        center={center}
        marketing={marketing}
        {...mapProps}
      />
    </div>
  );
}
