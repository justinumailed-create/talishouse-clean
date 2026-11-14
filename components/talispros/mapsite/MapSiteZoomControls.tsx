"use client";

import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";
import { clampMapZoom } from "@/lib/home-pin-coordinates";
import { useMapEngine } from "@/components/talismaps/map-engine/MapEngineProvider";
import { useT } from "@/lib/i18n/client";

/**
 * Fixed on the document, not inside the map.
 * Google Maps paints a full-size tile layer over siblings in that root,
 * which hides controls that only have a class-based z-index.
 */
const CLUSTER_STYLE: CSSProperties = {
  position: "fixed",
  zIndex: 80,
  display: "flex",
  flexDirection: "column",
  gap: 6,
  pointerEvents: "auto",
};

const BUTTON_STYLE: CSSProperties = {
  width: 44,
  height: 44,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 10,
  border: "1px solid rgba(0, 0, 0, 0.2)",
  background: "#ffffff",
  color: "#171717",
  fontSize: 22,
  fontWeight: 600,
  lineHeight: 1,
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.28)",
  cursor: "pointer",
  padding: 0,
};

export default function MapSiteZoomControls({
  mapRef,
  top,
}: {
  mapRef: RefObject<HTMLElement | null>;
  /** Offset from the top of the map, already clear of the left card and Aisha. */
  top: number;
}) {
  const { viewport, setViewport, isReady } = useMapEngine();
  const t = useT();
  const zoom = viewport.zoom;
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useLayoutEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const place = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 40 || rect.height < 40) return;
      setPos({
        top: Math.round(rect.top + top),
        right: Math.round(window.innerWidth - rect.right + 12),
      });
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(el);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [mapRef, top]);

  function step(delta: number) {
    setViewport({
      center: viewport.center,
      zoom: clampMapZoom(zoom + delta),
    });
  }

  if (!pos || typeof document === "undefined") return null;

  return createPortal(
    <div
      style={{ ...CLUSTER_STYLE, top: pos.top, right: pos.right }}
      data-testid="mapsite-zoom-controls"
      data-zoom={zoom}
    >
      <button
        type="button"
        style={{ ...BUTTON_STYLE, opacity: !isReady || zoom >= 21 ? 0.4 : 1 }}
        aria-label={t.mapsite.zoomIn}
        data-testid="mapsite-zoom-in"
        disabled={!isReady || zoom >= 21}
        onClick={() => step(1)}
      >
        +
      </button>
      <button
        type="button"
        style={{ ...BUTTON_STYLE, opacity: !isReady || zoom <= 3 ? 0.4 : 1 }}
        aria-label={t.mapsite.zoomOut}
        data-testid="mapsite-zoom-out"
        disabled={!isReady || zoom <= 3}
        onClick={() => step(-1)}
      >
        −
      </button>
    </div>,
    document.body,
  );
}
