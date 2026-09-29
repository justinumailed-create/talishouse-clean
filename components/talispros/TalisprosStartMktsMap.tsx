"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import MapEngineFitBounds from "@/components/talismaps/map-engine/MapEngineFitBounds";
import { MapEngineProvider } from "@/components/talismaps/map-engine/MapEngineProvider";
import {
  TALISU_MKTS_PINS,
  TALISU_MKTS_START_FIT_PADDING,
  TALISU_MKTS_VIEWPORT,
  talisuMktsMapCoordinates,
  talisuMktsToEnginePins,
} from "@/lib/talisu/markets-pins";

const MapEngineCanvas = dynamic(
  () => import("@/components/talismaps/map-engine/MapEngineCanvas"),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-neutral-200" />,
  },
);

/**
 * Chrome-free /start right-rail map: same pin source as /talisu/mkts, no
 * sidebar/cards/nav. Gestures and pin clicks disabled so it stays a preview.
 */
export default function TalisprosStartMktsMap() {
  const enginePins = useMemo(() => talisuMktsToEnginePins(TALISU_MKTS_PINS), []);
  const fitCoordinates = useMemo(() => talisuMktsMapCoordinates(), []);
  const fitPadding = useMemo(
    () => ({
      top: TALISU_MKTS_START_FIT_PADDING.top,
      right: TALISU_MKTS_START_FIT_PADDING.right,
      bottom: TALISU_MKTS_START_FIT_PADDING.bottom,
      left: TALISU_MKTS_START_FIT_PADDING.left,
    }),
    [],
  );

  return (
    <div className="absolute inset-0">
      <MapEngineProvider
        providerId="google-maps"
        initialPins={enginePins}
        initialViewport={TALISU_MKTS_VIEWPORT}
        selectedPinId={null}
        draggablePinIds={[]}
        basemapView="satellite"
        interactive={false}
        scrollZoom={false}
        preserveViewport
      >
        <MapEngineFitBounds coordinates={fitCoordinates} padding={fitPadding} />
        <MapEngineCanvas className="absolute inset-0 h-full w-full" />
      </MapEngineProvider>
      {/* Swallow residual pin clicks; gestures already off via interactive={false}. */}
      <div className="absolute inset-0 z-10" aria-hidden />
    </div>
  );
}
