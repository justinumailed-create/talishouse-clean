"use client";

import { useMemo } from "react";
import type { TalisMapsPin } from "@/lib/talismaps";
import { toMapEnginePins } from "@/lib/talismaps/map-engine";
import { useTalisMapsMapDefaults } from "@/lib/talismaps/use-map-defaults";
import MapEngineCanvas from "@/components/talismaps/map-engine/MapEngineCanvas";
import { MapEngineProvider } from "@/components/talismaps/map-engine/MapEngineProvider";

interface MapViewProps {
  pins: TalisMapsPin[];
  selectedPin: TalisMapsPin | null;
  onSelectPin: (pin: TalisMapsPin | null) => void;
  center?: [number, number];
  zoom?: number;
}

export default function MapView({
  pins,
  selectedPin,
  onSelectPin,
  center,
  zoom,
}: MapViewProps) {
  const enginePins = useMemo(() => toMapEnginePins(pins), [pins]);
  const defaults = useTalisMapsMapDefaults();

  const initialViewport = useMemo(
    () => ({
      center: {
        latitude: center?.[0] ?? 43.6532,
        longitude: center?.[1] ?? -79.3832,
      },
      zoom: zoom ?? 10,
    }),
    [center, zoom]
  );

  return (
    <MapEngineProvider
      providerId={defaults.providerId}
      basemapView={defaults.basemapView}
      initialPins={enginePins}
      initialViewport={initialViewport}
      selectedPinId={selectedPin?.id ?? null}
      onPinSelect={(pinId) => {
        if (!pinId) {
          onSelectPin(null);
          return;
        }
        onSelectPin(pins.find((pin) => pin.id === pinId) ?? null);
      }}
      onViewportChange={() => {
        // Public map shell does not surface viewport yet.
      }}
    >
      <MapEngineCanvas className="h-full w-full" />
    </MapEngineProvider>
  );
}
