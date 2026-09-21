"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { MapEngineProvider } from "@/components/talismaps/map-engine/MapEngineProvider";
import type { MapEnginePin } from "@/lib/talismaps/map-engine/types";
import { DEMO_MAPSITE_BUILD_PATH } from "@/lib/talispros/demo-mapsite";
import { mapSitePinVisualFields } from "@/lib/mapsite-pin-style";
import {
  TALISPROS_HOME_MAP_FALLBACK,
  TALISPROS_HOME_MAP_RADIUS_KM,
  TALISPROS_HOME_MAPSITE_CARD,
  zoomForMapRadiusKm,
} from "@/lib/talispros/start-content";

const MapEngineCanvas = dynamic(
  () => import("@/components/talismaps/map-engine/MapEngineCanvas"),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-neutral-200" />,
  },
);

export default function TalisprosHomeMapPreview() {
  const center = TALISPROS_HOME_MAP_FALLBACK;
  const [minViewportPx, setMinViewportPx] = useState(640);
  const [cardOpen, setCardOpen] = useState(true);

  const pins: MapEnginePin[] = useMemo(() => {
    const visual = mapSitePinVisualFields();
    return [
      {
        id: "home-pin",
        latitude: center.latitude,
        longitude: center.longitude,
        color: visual.pinColor,
        featured: true,
        metadata: {
          icon: visual.pinIcon,
          border: visual.pinBorder,
          whiteCenter: visual.whiteCenter,
          animated: visual.pinAnimated,
        },
      },
    ];
  }, [center.latitude, center.longitude]);

  const viewport = useMemo(
    () => ({
      center,
      zoom: zoomForMapRadiusKm(
        center.latitude,
        TALISPROS_HOME_MAP_RADIUS_KM,
        minViewportPx,
      ),
    }),
    [center, minViewportPx],
  );

  return (
    <div
      className="relative aspect-video overflow-hidden bg-neutral-200"
      ref={(node) => {
        if (!node) return;
        const apply = () => {
          const next = Math.min(node.clientWidth, node.clientHeight);
          if (next <= 0) return;
          setMinViewportPx((current) =>
            Math.abs(current - next) < 2 ? current : next,
          );
        };
        apply();
        const observer = new ResizeObserver(apply);
        observer.observe(node);
        return () => observer.disconnect();
      }}
    >
      <MapEngineProvider
        key={`${center.latitude.toFixed(5)}-${center.longitude.toFixed(5)}`}
        basemapView="satellite"
        initialPins={pins}
        initialViewport={viewport}
        selectedPinId="home-pin"
        lockCenter
        preserveViewport
        interactive
        lockCenterOffset={{ x: 0, y: 0 }}
      >
        <MapEngineCanvas className="absolute inset-0 h-full w-full" />
      </MapEngineProvider>

      {cardOpen ? (
      <div className="pointer-events-none absolute inset-x-0 top-[6%] z-20 flex justify-center px-3 sm:top-[8%] sm:px-4">
        <article
          className="pointer-events-auto relative w-[min(92%,22rem)] overflow-hidden rounded-2xl bg-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.28)] ring-1 ring-black/5 backdrop-blur-sm"
          aria-label={TALISPROS_HOME_MAPSITE_CARD.title}
        >
          <div className="relative bg-gradient-to-b from-white/70 to-white/90 px-3 pb-2.5 pt-2.5 sm:px-4 sm:pb-3 sm:pt-3">
            <button
              type="button"
              aria-label="Dismiss Mapsite™ card"
              onClick={() => setCardOpen(false)}
              className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-neutral-400/40 transition hover:bg-black/[0.04] hover:text-neutral-500/70 sm:right-2 sm:top-2"
            >
              <X className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <h2 className="m-0 mt-0 pr-6 text-[22px] font-semibold leading-tight tracking-tight text-black sm:text-[26px]">
              {TALISPROS_HOME_MAPSITE_CARD.title}
            </h2>
            <p className="m-0 mt-1 line-clamp-2 text-[12px] leading-snug text-neutral-800 sm:mt-1.5 sm:line-clamp-none sm:text-[13px]">
              {TALISPROS_HOME_MAPSITE_CARD.body}
            </p>
            <Link
              href={DEMO_MAPSITE_BUILD_PATH}
              className="mt-2 flex min-h-9 w-full items-center justify-center rounded-xl border border-neutral-200/80 bg-white/80 px-4 py-1.5 text-sm font-medium text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition hover:border-neutral-300 hover:bg-white sm:mt-3 sm:min-h-10 sm:py-2"
            >
              {TALISPROS_HOME_MAPSITE_CARD.cta}
            </Link>
          </div>
          <div
            className="pointer-events-none mx-auto -mb-px h-0 w-0 border-l-[11px] border-r-[11px] border-t-[12px] border-l-transparent border-r-transparent border-t-white/80 drop-shadow-[0_2px_2px_rgba(0,0,0,0.12)]"
            aria-hidden
          />
        </article>
      </div>
      ) : null}
    </div>
  );
}
