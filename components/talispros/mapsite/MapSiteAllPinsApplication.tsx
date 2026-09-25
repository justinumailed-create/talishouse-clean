"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import MapEngineCanvas from "@/components/talismaps/map-engine/MapEngineCanvas";
import {
  MapEngineProvider,
  useMapEngine,
} from "@/components/talismaps/map-engine/MapEngineProvider";
import type { MapEnginePin } from "@/lib/talismaps/map-engine";
import type { AllPinsAggregation } from "@/lib/talispros/allpins-mapsite";
import {
  allPinsPublishedHref,
  ISOLATED_BOOKSHELF_PATH,
} from "@/lib/talispros/allpins-mapsite-ui";
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
      aggregation.pins.map((pin) => ({
        id: pin.id,
        latitude: pin.latitude,
        longitude: pin.longitude,
        color: "#0ea5e9",
        featured: true,
        metadata: {
          icon: "dot",
          whiteCenter: true,
          pinSize: 52,
          animated: false,
          label: pin.fastCode.toUpperCase(),
          fastCode: pin.fastCode,
        },
      })),
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

      <header className="pointer-events-none absolute right-3 top-3 z-30 flex max-w-[min(92vw,20rem)] flex-col items-end gap-2 sm:right-4 sm:top-4">
        <div className="pointer-events-auto rounded-2xl bg-white/90 px-4 py-3 shadow-lg ring-1 ring-black/5 backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            FAST Code · ALLPINS
          </p>
          <h1 className="mt-1 text-[15px] font-semibold tracking-tight text-neutral-950">
            Every Mapsite™ pin
          </h1>
          <p className="mt-1 text-[12px] leading-snug text-neutral-600">
            {aggregation.pins.length} live pin
            {aggregation.pins.length === 1 ? "" : "s"} from existing Mapsites™.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href={allPinsPublishedHref()}
              className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-neutral-800 hover:bg-neutral-50"
            >
              Published URL
            </Link>
            <Link
              href={ISOLATED_BOOKSHELF_PATH}
              className="rounded-lg bg-neutral-950 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-neutral-800"
            >
              Isolated shelf
            </Link>
          </div>
        </div>
      </header>

      <MapSiteAllPinsShowcase
        aggregation={aggregation}
        selectedPinId={selectedPinId}
        onSelectPin={(pinId) => {
          beginFocusGuard();
          setSelectedPinId(pinId);
        }}
      />
    </>
  );
}
