"use client";

import { Expand, Map, X } from "lucide-react";
import { useCallback, useState, useSyncExternalStore, type MouseEvent, type ReactNode } from "react";
import { mapsiteFullscreenMapHref } from "@/lib/mapsite-layout";

const HOVER_QUERY = "(hover: hover) and (pointer: fine)";

function subscribeHoverCapability(onChange: () => void) {
  const list = window.matchMedia(HOVER_QUERY);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
}

function useHoverCapable() {
  return useSyncExternalStore(
    subscribeHoverCapability,
    () => window.matchMedia(HOVER_QUERY).matches,
    () => false,
  );
}

function isPinTarget(target: EventTarget | null) {
  return (
    target instanceof Element && Boolean(target.closest(".talismaps-pin-marker"))
  );
}

function isOverlayControl(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest("[data-mapsite-map-overlay-controls]"))
  );
}

interface MapSitePublishedMapOverlayProps {
  fastCode: string;
  open: boolean;
}

export function MapSitePublishedMapOverlayPanel({
  fastCode,
  open,
}: MapSitePublishedMapOverlayProps) {
  const href = mapsiteFullscreenMapHref(fastCode);

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[400] flex items-center justify-center bg-black/75 px-5 text-center transition-opacity duration-200 ${
        open ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden={!open}
      data-mapsite-map-overlay=""
    >
      <div
        data-mapsite-map-overlay-controls=""
        className={`flex w-full max-w-sm flex-col items-stretch gap-3 ${
          open ? "pointer-events-auto" : "pointer-events-none invisible"
        }`}
      >
        <p className="text-sm font-medium tracking-wide text-white/80">
          Map options
        </p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 shadow-md transition hover:bg-neutral-100"
        >
          <Expand className="h-4 w-4" aria-hidden />
          Open full-screen map
        </a>
        <a
          href={href}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/20"
        >
          <Map className="h-4 w-4" aria-hidden />
          Open interactive map
        </a>
      </div>
    </div>
  );
}

interface MapSitePublishedMapFrameProps {
  fastCode: string;
  className: string;
  mapZoom: number;
  children: ReactNode;
}

export default function MapSitePublishedMapFrame({
  fastCode,
  className,
  mapZoom,
  children,
}: MapSitePublishedMapFrameProps) {
  const hoverCapable = useHoverCapable();
  const [hovered, setHovered] = useState(false);
  const [touchOpen, setTouchOpen] = useState(false);
  const open = hoverCapable ? hovered : touchOpen;

  const onMouseEnter = useCallback(() => {
    if (hoverCapable) setHovered(true);
  }, [hoverCapable]);

  const onMouseLeave = useCallback(() => {
    if (hoverCapable) setHovered(false);
  }, [hoverCapable]);

  const onClickCapture = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (hoverCapable) return;
      if (isPinTarget(event.target)) return;
      if (isOverlayControl(event.target)) return;
      setTouchOpen((current) => !current);
    },
    [hoverCapable],
  );

  return (
    <div
      className={className}
      data-mapsite-published-map=""
      data-map-zoom={String(mapZoom)}
      data-map-interactive="false"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClickCapture={onClickCapture}
    >
      {children}
      <MapSitePublishedMapOverlayPanel fastCode={fastCode} open={open} />
      {!hoverCapable && !open ? (
        <p className="pointer-events-none absolute bottom-3 left-1/2 z-[350] -translate-x-1/2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white shadow-sm">
          Tap map for options
        </p>
      ) : null}
      {!hoverCapable && open ? (
        <button
          type="button"
          data-mapsite-map-overlay-controls=""
          onClick={() => setTouchOpen(false)}
          className="absolute right-3 top-3 z-[450] inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-neutral-900 shadow-md"
          aria-label="Close map options"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
