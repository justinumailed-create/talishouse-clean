"use client";

import { clampMapZoom } from "@/lib/home-pin-coordinates";
import { useMapEngine } from "@/components/talismaps/map-engine/MapEngineProvider";
import { useT } from "@/lib/i18n/client";

const ZOOM_BUTTON =
  "inline-flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-900/15 bg-white/95 text-[22px] font-semibold leading-none text-neutral-950 shadow-[0_4px_14px_rgba(0,0,0,0.22)] backdrop-blur-sm transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#046BD9] disabled:cursor-not-allowed disabled:opacity-40";

/** Plus and minus for every claimed Mapsite that uses this map. */
export default function MapSiteZoomControls({ top }: { top: number }) {
  const { viewport, setViewport, isReady } = useMapEngine();
  const t = useT();
  const zoom = viewport.zoom;

  function step(delta: number) {
    setViewport({
      center: viewport.center,
      zoom: clampMapZoom(zoom + delta),
    });
  }

  return (
    <div
      className="pointer-events-auto absolute right-3 z-40 flex flex-col gap-1.5"
      style={{ top }}
      data-testid="mapsite-zoom-controls"
      data-zoom={zoom}
    >
      <button
        type="button"
        className={ZOOM_BUTTON}
        aria-label={t.mapsite.zoomIn}
        data-testid="mapsite-zoom-in"
        disabled={!isReady || zoom >= 21}
        onClick={() => step(1)}
      >
        +
      </button>
      <button
        type="button"
        className={ZOOM_BUTTON}
        aria-label={t.mapsite.zoomOut}
        data-testid="mapsite-zoom-out"
        disabled={!isReady || zoom <= 3}
        onClick={() => step(-1)}
      >
        −
      </button>
    </div>
  );
}
