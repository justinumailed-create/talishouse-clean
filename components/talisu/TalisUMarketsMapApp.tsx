"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapEngineCanvas from "@/components/talismaps/map-engine/MapEngineCanvas";
import {
  MapEngineProvider,
  useMapEngine,
} from "@/components/talismaps/map-engine/MapEngineProvider";
import type { MapEnginePin } from "@/lib/talismaps/map-engine";
import {
  TALISU_MKTS_FLAG_CA,
  TALISU_MKTS_FOOTER,
  TALISU_MKTS_PINS,
  TALISU_MKTS_VIEWPORT,
  type TalisUMktsPin,
} from "@/lib/talisu/markets-pins";
import TalisUMarketsPinCard from "./TalisUMarketsPinCard";
import TalisUMarketsSidebar from "./TalisUMarketsSidebar";

const FOCUS_GESTURE_GUARD_MS = 900;

function toEnginePins(pins: readonly TalisUMktsPin[]): MapEnginePin[] {
  return pins
    .filter((pin) => pin.showOnMap)
    .map((pin) => {
      if (pin.kind === "market") {
        return {
          id: pin.id,
          latitude: pin.latitude,
          longitude: pin.longitude,
          color: "#FF0000",
          featured: false,
          metadata: {
            icon: "dot",
            whiteCenter: true,
            customLogoUrl: TALISU_MKTS_FLAG_CA,
            pinSize: 58,
            animated: false,
            label: pin.label,
          },
        } satisfies MapEnginePin;
      }
      // Do More… action pins — solid blue dots (not ALLPINS multi-color).
      return {
        id: pin.id,
        latitude: pin.latitude,
        longitude: pin.longitude,
        color: "#0069CF",
        featured: false,
        metadata: {
          icon: "dot",
          whiteCenter: true,
          pinSize: 44,
          animated: false,
          label: pin.label,
        },
      } satisfies MapEnginePin;
    });
}

export default function TalisUMarketsMapApp() {
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const focusingRef = useRef(false);
  const focusTimerRef = useRef<number | null>(null);
  const enginePins = useMemo(() => toEnginePins(TALISU_MKTS_PINS), []);

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
    <MapEngineProvider
      providerId="google-maps"
      initialPins={enginePins}
      initialViewport={TALISU_MKTS_VIEWPORT}
      selectedPinId={selectedPinId}
      draggablePinIds={[]}
      onPinSelect={(pinId) => setSelectedPinId(pinId)}
      onMapClick={() => dismissIfUserGesture()}
      onMapDragStart={dismissIfUserGesture}
      onMapZoom={dismissIfUserGesture}
      basemapView="satellite"
      scrollZoom={false}
    >
      <MarketsChrome
        selectedPinId={selectedPinId}
        setSelectedPinId={setSelectedPinId}
        beginFocusGuard={beginFocusGuard}
      />
    </MapEngineProvider>
  );
}

function MarketsChrome({
  selectedPinId,
  setSelectedPinId,
  beginFocusGuard,
}: {
  selectedPinId: string | null;
  setSelectedPinId: (id: string | null) => void;
  beginFocusGuard: () => void;
}) {
  const { setViewport } = useMapEngine();
  const lastFocusedRef = useRef<string | null>(null);

  const selectedPin = useMemo(
    () => TALISU_MKTS_PINS.find((pin) => pin.id === selectedPinId) ?? null,
    [selectedPinId]
  );

  const focusPin = useCallback(
    (pinId: string) => {
      const pin = TALISU_MKTS_PINS.find((item) => item.id === pinId);
      if (!pin) return;
      beginFocusGuard();
      lastFocusedRef.current = pinId;
      setViewport({
        center: { latitude: pin.latitude, longitude: pin.longitude },
        zoom: pin.mapZoom,
      });
      setSelectedPinId(pinId);
    },
    [beginFocusGuard, setSelectedPinId, setViewport]
  );

  useEffect(() => {
    if (!selectedPinId) {
      lastFocusedRef.current = null;
      return;
    }
    if (lastFocusedRef.current === selectedPinId) return;
    const pin = TALISU_MKTS_PINS.find((item) => item.id === selectedPinId);
    if (!pin) return;
    beginFocusGuard();
    setViewport({
      center: { latitude: pin.latitude, longitude: pin.longitude },
      zoom: pin.mapZoom,
    });
    lastFocusedRef.current = selectedPinId;
  }, [selectedPinId, beginFocusGuard, setViewport]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-neutral-900">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <MapEngineCanvas className="h-full w-full" />

        <TalisUMarketsSidebar
          pins={TALISU_MKTS_PINS}
          selectedPinId={selectedPinId}
          onSelectPin={focusPin}
        />

        {selectedPin ? (
          <TalisUMarketsPinCard
            pin={selectedPin}
            onClose={() => setSelectedPinId(null)}
          />
        ) : null}
      </div>

      <footer className="shrink-0 border-t border-black/10 bg-white px-4 py-3 text-center text-[12px] leading-snug text-neutral-700 sm:px-6 sm:text-[13px]">
        {TALISU_MKTS_FOOTER}
      </footer>
    </div>
  );
}
