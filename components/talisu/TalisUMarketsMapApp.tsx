"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapEngineCanvas from "@/components/talismaps/map-engine/MapEngineCanvas";
import MapEngineFitBounds from "@/components/talismaps/map-engine/MapEngineFitBounds";
import {
  MapEngineProvider,
  useMapEngine,
} from "@/components/talismaps/map-engine/MapEngineProvider";
import {
  TALISU_MKTS_FIT_PADDING,
  TALISU_MKTS_PINS,
  localizeTalisUMktsPins,
  TALISU_MKTS_VIEWPORT,
  talisuMktsMapCoordinates,
  talisuMktsToEnginePins,
  type TalisUMktsPin,
} from "@/lib/talisu/markets-pins";
import TalisUMarketsPinCard from "./TalisUMarketsPinCard";
import TalisUMarketsSidebar from "./TalisUMarketsSidebar";
import { useT } from "@/lib/i18n/client";

const FOCUS_GESTURE_GUARD_MS = 900;

export default function TalisUMarketsMapApp() {
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const focusingRef = useRef(false);
  const focusTimerRef = useRef<number | null>(null);
  const t = useT();
  const pins = useMemo(
    () => localizeTalisUMktsPins(TALISU_MKTS_PINS, t.markets),
    [t],
  );
  // Engine pins keep the first-render labels (map re-init is avoided on switch).
  const enginePins = useMemo(() => talisuMktsToEnginePins(pins), [pins]);
  const fitCoordinates = useMemo(() => talisuMktsMapCoordinates(), []);
  const fitPadding = useMemo(
    () => ({
      top: TALISU_MKTS_FIT_PADDING.top,
      right: TALISU_MKTS_FIT_PADDING.right,
      bottom: TALISU_MKTS_FIT_PADDING.bottom,
      left: TALISU_MKTS_FIT_PADDING.left,
    }),
    []
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
      preserveViewport
    >
      <MapEngineFitBounds coordinates={fitCoordinates} padding={fitPadding} />
      <MarketsChrome
        pins={pins}
        footer={t.markets.footer}
        selectedPinId={selectedPinId}
        setSelectedPinId={setSelectedPinId}
        beginFocusGuard={beginFocusGuard}
      />
    </MapEngineProvider>
  );
}

function MarketsChrome({
  pins,
  footer,
  selectedPinId,
  setSelectedPinId,
  beginFocusGuard,
}: {
  pins: readonly TalisUMktsPin[];
  footer: string;
  selectedPinId: string | null;
  setSelectedPinId: (id: string | null) => void;
  beginFocusGuard: () => void;
}) {
  const { setViewport } = useMapEngine();
  const lastFocusedRef = useRef<string | null>(null);

  const selectedPin = useMemo(
    () => pins.find((pin) => pin.id === selectedPinId) ?? null,
    [pins, selectedPinId]
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
          pins={pins}
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
        {footer}
      </footer>
    </div>
  );
}
