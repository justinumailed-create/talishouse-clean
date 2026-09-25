"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapEngineCanvas from "@/components/talismaps/map-engine/MapEngineCanvas";
import {
  MapEngineProvider,
  useMapEngine,
} from "@/components/talismaps/map-engine/MapEngineProvider";
import type { MapEnginePin } from "@/lib/talismaps/map-engine";
import type { AllPinsAggregation } from "@/lib/talispros/allpins-mapsite";
import {
  MAPSITE_PIN_DEFAULT_BORDER,
  MAPSITE_PIN_DEFAULT_ICON,
  resolveMapSitePinStyle,
} from "@/lib/mapsite-pin-style";
import MapSiteAllPinsPinCard from "./MapSiteAllPinsPinCard";
import MapSiteAllPinsShowcase from "./MapSiteAllPinsShowcase";

const FOCUS_GESTURE_GUARD_MS = 900;

type Props = {
  aggregation: AllPinsAggregation;
};

export default function MapSiteAllPinsApplication({ aggregation }: Props) {
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const focusingRef = useRef(false);
  const focusTimerRef = useRef<number | null>(null);

  const enginePins: MapEnginePin[] = useMemo(
    () =>
      aggregation.pins.map((pin) => {
        const savedPin = resolveMapSitePinStyle({
          pinIcon: pin.pinIcon,
          pinColor: pin.pinColor,
          pinBorder: pin.pinBorder,
          pinWhiteCenter: pin.whiteCenter,
          pinAnimated: pin.pinAnimated,
          pinCategoryBadge: pin.pinCategoryBadge,
        });
        return {
          id: pin.id,
          latitude: pin.latitude,
          longitude: pin.longitude,
          color: savedPin.pinColor,
          label: pin.fastCode.toUpperCase(),
          featured: true,
          metadata: {
            icon: savedPin.pinIcon || MAPSITE_PIN_DEFAULT_ICON,
            border: savedPin.pinBorder || MAPSITE_PIN_DEFAULT_BORDER,
            whiteCenter: savedPin.whiteCenter,
            animated: savedPin.pinAnimated,
            categoryBadge: savedPin.pinCategoryBadge,
            label: pin.fastCode.toUpperCase(),
            fastCode: pin.fastCode,
          },
        };
      }),
    [aggregation.pins],
  );

  const viewport = useMemo(
    () => ({
      center: {
        latitude: aggregation.center.latitude,
        longitude: aggregation.center.longitude,
      },
      zoom: aggregation.zoom,
    }),
    [aggregation.center.latitude, aggregation.center.longitude, aggregation.zoom],
  );

  const beginFocusGuard = useCallback(() => {
    focusingRef.current = true;
    if (focusTimerRef.current != null) {
      window.clearTimeout(focusTimerRef.current);
    }
    focusTimerRef.current = window.setTimeout(() => {
      focusingRef.current = false;
      focusTimerRef.current = null;
    }, FOCUS_GESTURE_GUARD_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (focusTimerRef.current != null) {
        window.clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  const dismissIfUserGesture = useCallback(() => {
    if (focusingRef.current) return;
    setSelectedPinId(null);
  }, []);

  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden bg-neutral-900"
      data-testid="allpins-mapsite"
    >
      <MapEngineProvider
        providerId="google-maps"
        initialPins={enginePins}
        initialViewport={viewport}
        selectedPinId={selectedPinId}
        draggablePinIds={[]}
        onPinSelect={(pinId) => {
          if (!pinId) {
            dismissIfUserGesture();
            return;
          }
          beginFocusGuard();
          setSelectedPinId(pinId);
        }}
        onMapClick={() => dismissIfUserGesture()}
        onMapDragStart={dismissIfUserGesture}
        onMapZoom={dismissIfUserGesture}
        basemapView="satellite"
        scrollZoom={true}
      >
        <AllPinsChrome
          aggregation={aggregation}
          selectedPinId={selectedPinId}
          setSelectedPinId={setSelectedPinId}
          beginFocusGuard={beginFocusGuard}
        />
      </MapEngineProvider>
    </div>
  );
}

function AllPinsChrome({
  aggregation,
  selectedPinId,
  setSelectedPinId,
  beginFocusGuard,
}: {
  aggregation: AllPinsAggregation;
  selectedPinId: string | null;
  setSelectedPinId: (id: string | null) => void;
  beginFocusGuard: () => void;
}) {
  const { setViewport, isReady } = useMapEngine();

  useEffect(() => {
    if (!selectedPinId || !isReady) return;
    const pin = aggregation.pins.find((item) => item.id === selectedPinId);
    if (!pin) return;
    beginFocusGuard();
    setViewport({
      center: { latitude: pin.latitude, longitude: pin.longitude },
      zoom: Math.max(aggregation.zoom, 12),
    });
  }, [
    selectedPinId,
    aggregation.pins,
    aggregation.zoom,
    beginFocusGuard,
    isReady,
    setViewport,
  ]);

  return (
    <>
      <div className="absolute inset-0">
        <MapEngineCanvas className="h-full w-full" />
      </div>

      <MapSiteAllPinsShowcase
        aggregation={aggregation}
        selectedPinId={selectedPinId}
        onSelectPin={(pinId) => {
          beginFocusGuard();
          setSelectedPinId(pinId);
        }}
      />

      {selectedPinId
        ? (() => {
            const pin = aggregation.pins.find((p) => p.id === selectedPinId);
            return pin ? (
              <MapSiteAllPinsPinCard
                pin={pin}
                onClose={() => setSelectedPinId(null)}
              />
            ) : null;
          })()
        : null}
    </>
  );
}
