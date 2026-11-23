"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MapEngineProvider, useMapEngine } from "@/components/talismaps/map-engine/MapEngineProvider";
import type { MapEnginePin } from "@/lib/talismaps/map-engine/types";
import { useT } from "@/lib/i18n/client";
import { mapSitePinVisualFields } from "@/lib/mapsite-pin-style";
import { MAPSITE_LISTING_IMAGE_CLASS } from "@/lib/talispros/mapsite-listing-media";
import {
  DEMO_DISPLAY_PIN,
  DEMO_PIN_CARD_ACTIONS,
  demoHeroPinScreenOffset,
} from "@/lib/talispros/demo-builder";
import {
  CENTREFOLD_BOOK_HREF,
  CENTREFOLD_PIN_IMAGE,
  CENTREFOLD_TITLE,
} from "@/lib/talispros/centrefold-book";
import PinActionExplainer, {
  type PinActionExplainerId,
} from "@/components/talispros/mapsite/PinActionExplainer";

const MapEngineCanvas = dynamic(
  () => import("@/components/talismaps/map-engine/MapEngineCanvas"),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-[#c9c3b8]" />,
  },
);

/** The PIN's TEB™ (the 20 page green-screen Centrefolds eBook, Ralf Nov 22). */
const TEB_LABEL = "TEB™";

/**
 * Blue pill from Aisha's register page (`RegisterStructureTabs`): same radius,
 * colour, weight and shadow, sized to sit in the PIN card.
 */
const PIN_ACTION_CLASS =
  "inline-flex min-h-9 w-full items-center justify-center whitespace-nowrap rounded-full bg-[#046BD9] px-1.5 text-center text-[11px] font-semibold text-white shadow-[0_6px_14px_rgba(4,107,217,0.3)] sm:min-h-10 sm:px-2 sm:text-[13px]";

export type DemoHeroMapPin = {
  id: string;
  latitude: number;
  longitude: number;
  zoom: number;
  /** When set, the Home PIN uses this fill (Mapsite home uses the red own-PIN). */
  color?: string;
};

/**
 * A Mapsite display map with the Home PIN card open (URL 1, URL 2, TEB™, TTV™).
 * The Mapsites hero uses the sample Bay St. Lawrence PIN; Home Market passes
 * the visitor's own pin and particulars. When Google Maps cannot load, the
 * card and a fallback pin stay on a neutral map background.
 */
export default function DemoHeroMap({
  pin = DEMO_DISPLAY_PIN,
  title,
  body,
  accountLabel,
  testId = "demo-hero",
  cardOffsetClass = "top-4 lg:top-48",
}: {
  pin?: DemoHeroMapPin;
  title?: string;
  body?: string;
  accountLabel?: string;
  testId?: string;
  /** Placement of the open PIN card over the map. */
  cardOffsetClass?: string;
} = {}) {
  const card = useT().demo.hero.pinCard;
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const [pinOffsetY, setPinOffsetY] = useState(0);
  const [mapFailed, setMapFailed] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const check = () => {
      if (root.querySelector(".gm-err-container, .gm-err-heading")) setMapFailed(true);
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pin.id, pin.latitude, pin.longitude, pin.zoom]);

  const pins: MapEnginePin[] = useMemo(() => {
    const visual = mapSitePinVisualFields(
      pin.color
        ? { pinColor: pin.color, pinIcon: "none", pinWhiteCenter: true }
        : undefined,
    );
    return [
      {
        id: pin.id,
        latitude: pin.latitude,
        longitude: pin.longitude,
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
  }, [pin.id, pin.latitude, pin.longitude, pin.color]);

  const viewport = useMemo(
    () => ({
      center: {
        latitude: pin.latitude,
        longitude: pin.longitude,
      },
      zoom: pin.zoom,
    }),
    [pin.latitude, pin.longitude, pin.zoom],
  );

  useLayoutEffect(() => {
    const root = rootRef.current;
    const article = cardRef.current;
    if (!root || !article) return;

    const place = () => {
      const rootRect = root.getBoundingClientRect();
      const cardRect = article.getBoundingClientRect();
      setPinOffsetY(
        demoHeroPinScreenOffset(rootRect.height, cardRect.bottom - rootRect.top),
      );
    };

    place();
    const observer = new ResizeObserver(place);
    observer.observe(root);
    observer.observe(article);
    return () => observer.disconnect();
  }, [title, body, accountLabel]);

  const cardTitle = title ?? CENTREFOLD_TITLE;
  const cardBody = body ?? card.body;

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden bg-[#c9c3b8]"
      data-testid={`${testId}-map`}
      data-pin-offset={pinOffsetY}
      aria-label={card.mapLabel}
    >
      <MapEngineProvider
        key={`${pin.id}:${pin.latitude}:${pin.longitude}:${pin.zoom}`}
        basemapView="satellite"
        initialPins={pins}
        initialViewport={viewport}
        selectedPinId={pin.id}
        lockCenter
        lockCenterOffset={{ x: 0, y: pinOffsetY }}
        interactive={false}
        scrollZoom={false}
        preserveViewport
      >
        <MapEngineCanvas className="absolute inset-0 h-full w-full" />
        <MapIdleBackdrop forced={mapFailed} />
        <FallbackHomePin offsetY={pinOffsetY} forced={mapFailed} color={pin.color} />
      </MapEngineProvider>
      <style>{`
        [data-testid="${testId}-map"] .gm-err-container,
        [data-testid="${testId}-map"] .gm-err-heading,
        [data-testid="${testId}-map"] .gm-err-message,
        [data-testid="${testId}-map"] .gm-err-autocomplete {
          display: none !important;
        }
      `}</style>

      {/* The PIN itself opens its TEB™ (the map stays display only). */}
      <Link
        href={CENTREFOLD_BOOK_HREF}
        aria-label={card.openEbook}
        data-testid={`${testId}-pin-link`}
        className="absolute left-1/2 z-[5] block h-[78px] w-[78px] -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        style={{ top: `calc(50% + ${pinOffsetY}px)` }}
      />

      <div className={`pointer-events-none absolute inset-x-0 z-10 flex justify-center px-4 ${cardOffsetClass}`}>
        <article
          ref={cardRef}
          data-pin-flag
          className="pointer-events-auto w-[min(92%,16.5rem)]"
          data-testid={`${testId}-pin-card`}
          aria-label={cardTitle}
        >
          <div className="overflow-hidden rounded-2xl bg-white/75 shadow-[0_12px_40px_rgba(0,0,0,0.28)] ring-1 ring-black/5 backdrop-blur-sm">
            <Link
              href={CENTREFOLD_BOOK_HREF}
              className="relative block h-16 w-full bg-neutral-200/80 sm:h-20 lg:h-28"
              aria-label={card.openEbook}
              data-testid={`${testId}-pin-image`}
            >
              <Image
                src={CENTREFOLD_PIN_IMAGE}
                alt={CENTREFOLD_TITLE}
                fill
                className={MAPSITE_LISTING_IMAGE_CLASS}
                sizes="280px"
                priority
              />
            </Link>
            <div className="bg-gradient-to-b from-white/70 to-white/80 px-3.5 pb-3 pt-2">
              <h2 className="m-0 text-[15px] font-semibold leading-tight tracking-tight text-black">{cardTitle}</h2>
              {accountLabel ? (
                <p className="m-0 mt-0.5 text-[11px] font-medium uppercase leading-tight tracking-[0.08em] text-neutral-500">
                  {accountLabel}
                </p>
              ) : null}
              <p className="m-0 mt-0.5 text-[12px] leading-snug text-neutral-800">{cardBody}</p>
              <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                {DEMO_PIN_CARD_ACTIONS.map((label) => {
                  const explainer: PinActionExplainerId = label.startsWith("TEB")
                    ? "teb"
                    : label.startsWith("TTV")
                      ? "ttv"
                      : "url";
                  return (
                    <PinActionExplainer key={label} action={explainer}>
                      {label === TEB_LABEL ? (
                        <Link
                          href={CENTREFOLD_BOOK_HREF}
                          aria-label={card.openEbook}
                          data-testid={`${testId}-pin-action`}
                          data-action="teb"
                          className={`${PIN_ACTION_CLASS} transition hover:bg-[#0558b3]`}
                        >
                          {label}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          data-testid={`${testId}-pin-action`}
                          className={PIN_ACTION_CLASS}
                        >
                          {label}
                        </button>
                      )}
                    </PinActionExplainer>
                  );
                })}
              </div>
            </div>
          </div>
          <div
            className="mx-auto -mt-px h-0 w-0 border-l-[11px] border-r-[11px] border-t-[12px] border-l-transparent border-r-transparent border-t-white/75 drop-shadow-[0_2px_2px_rgba(0,0,0,0.12)]"
            aria-hidden
          />
        </article>
      </div>
    </div>
  );
}

/** Neutral map field used when the live map has not become ready, or has failed. */
function MapIdleBackdrop({ forced = false }: { forced?: boolean }) {
  const { isReady } = useMapEngine();
  if (isReady && !forced) return null;
  return (
    <div
      className="absolute inset-0 z-[1]"
      data-testid="map-idle-backdrop"
      aria-hidden
      style={{
        backgroundColor: "#c9c3b8",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.28) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />
  );
}

/** Keeps the Home PIN visible under the open card when the map does not load. */
function FallbackHomePin({
  offsetY,
  forced = false,
  color,
}: {
  offsetY: number;
  forced?: boolean;
  color?: string;
}) {
  const { isReady } = useMapEngine();
  if (isReady && !forced) return null;
  const fill = color?.trim() || "#1A73E8";
  return (
    <span
      className="absolute left-1/2 z-[4] flex h-[46px] w-[46px] -translate-x-1/2 -translate-y-1/2 items-center justify-center"
      style={{ top: `calc(50% + ${offsetY}px)` }}
      data-testid="map-idle-pin"
      aria-hidden
    >
      <span
        className="relative flex h-10 w-10 items-center justify-center rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.28)]"
        style={{ backgroundColor: fill, boxShadow: `0 4px 10px rgba(0,0,0,0.28), 0 0 0 4px ${fill}40` }}
      >
        <span className="h-3 w-3 rounded-full bg-white" />
      </span>
    </span>
  );
}
