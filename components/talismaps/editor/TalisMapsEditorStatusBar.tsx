"use client";

import { createMapProvider } from "@/lib/talismaps/map-engine";
import { TALISMAPS_PRODUCT_NAME } from "@/lib/talismaps/constants";
import { useMapEngine } from "@/components/talismaps/map-engine/MapEngineProvider";
import { usePinEngine } from "@/components/talismaps/pin-engine/PinEngineProvider";

export default function TalisMapsEditorStatusBar() {
  const { providerId, basemapView, viewport, isReady, pins, selectedPinId } = useMapEngine();
  const { saveState } = usePinEngine();
  const provider = createMapProvider(providerId);

  return (
    <footer className="flex h-10 shrink-0 items-center justify-between border-t border-neutral-200/80 bg-white/95 px-4 text-[11px] text-neutral-500 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <span>{TALISMAPS_PRODUCT_NAME} Editor</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">{provider.label}</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline capitalize">{basemapView}</span>
        <span className="hidden md:inline">·</span>
        <span className="hidden md:inline capitalize">{saveState}</span>
        <span className="hidden lg:inline">·</span>
        <span className="hidden lg:inline">
          {pins.length} pin{pins.length === 1 ? "" : "s"}
          {selectedPinId ? " · 1 selected" : ""}
        </span>
      </div>
      <div className="flex items-center gap-4 tabular-nums">
        <span className="hidden md:inline">Zoom {viewport.zoom.toFixed(1)}</span>
        <span className="hidden lg:inline">
          Lat {viewport.center.latitude.toFixed(4)} · Lng{" "}
          {viewport.center.longitude.toFixed(4)}
        </span>
        <span>{isReady ? "Ready" : "Loading map"}</span>
      </div>
    </footer>
  );
}
