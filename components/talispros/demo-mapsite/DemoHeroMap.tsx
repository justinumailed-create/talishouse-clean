"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { MapEngineProvider } from "@/components/talismaps/map-engine/MapEngineProvider";
import type { MapEnginePin } from "@/lib/talismaps/map-engine/types";
import { useT } from "@/lib/i18n/client";
import { mapSitePinVisualFields } from "@/lib/mapsite-pin-style";
import { MAPSITE_LISTING_IMAGE_CLASS } from "@/lib/talispros/mapsite-listing-media";
import {
  DEMO_DISPLAY_PIN,
  DEMO_PIN_CARD_ACTIONS,
  demoHeroPinScreenOffset,
} from "@/lib/talispros/demo-builder";
import { NSNC_BOOK_HREF, NSNC_PIN_IMAGE, NSNC_TITLE } from "@/lib/talispros/nsnc-book";
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

/** The PIN's TEB™ (North Shore Nature Centre eBook) and its lake photo. */
const TEB_LABEL = "TEB™";

/**
 * Blue pill from Aisha's register page (`RegisterStructureTabs`): same radius,
 * colour, weight and shadow, sized to sit in the PIN card.
 */
const PIN_ACTION_CLASS =
  "inline-flex min-h-9 w-full items-center justify-center whitespace-nowrap rounded-full bg-[#046BD9] px-1.5 text-center text-[11px] font-semibold text-white shadow-[0_6px_14px_rgba(4,107,217,0.3)] sm:min-h-10 sm:px-2 sm:text-[13px]";

export default function DemoHeroMap() {
  const card = useT().demo.hero.pinCard;
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const [pinOffsetY, setPinOffsetY] = useState(0);
  const pins: MapEnginePin[] = useMemo(() => {
    const visual = mapSitePinVisualFields();
    return [
      {
        id: DEMO_DISPLAY_PIN.id,
        latitude: DEMO_DISPLAY_PIN.latitude,
        longitude: DEMO_DISPLAY_PIN.longitude,
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
  }, []);

  const viewport = useMemo(
    () => ({
      center: {
        latitude: DEMO_DISPLAY_PIN.latitude,
        longitude: DEMO_DISPLAY_PIN.longitude,
      },
      zoom: DEMO_DISPLAY_PIN.zoom,
    }),
    [],
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
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden bg-[#c9c3b8]"
      data-testid="demo-hero-map"
      data-pin-offset={pinOffsetY}
      aria-label={card.mapLabel}
    >
      <MapEngineProvider
        basemapView="satellite"
        initialPins={pins}
        initialViewport={viewport}
        selectedPinId={DEMO_DISPLAY_PIN.id}
        lockCenter
        lockCenterOffset={{ x: 0, y: pinOffsetY }}
        interactive={false}
        scrollZoom={false}
        preserveViewport
      >
        <MapEngineCanvas className="absolute inset-0 h-full w-full" />
      </MapEngineProvider>

      {/* The PIN itself opens its TEB™ (the map stays display only). */}
      <Link
        href={NSNC_BOOK_HREF}
        aria-label={card.openEbook}
        data-testid="demo-hero-pin-link"
        className="absolute left-1/2 z-[5] block h-[78px] w-[78px] -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        style={{ top: `calc(50% + ${pinOffsetY}px)` }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-4">
        <article
          ref={cardRef}
          className="pointer-events-auto w-[min(92%,16.5rem)]"
          data-testid="demo-hero-pin-card"
          aria-label={NSNC_TITLE}
        >
          <div className="overflow-hidden rounded-2xl bg-white/75 shadow-[0_12px_40px_rgba(0,0,0,0.28)] ring-1 ring-black/5 backdrop-blur-sm">
            <Link
              href={NSNC_BOOK_HREF}
              className="relative block h-16 w-full bg-neutral-200/80 sm:h-20 lg:h-28"
              aria-label={card.openEbook}
              data-testid="demo-hero-pin-image"
            >
              <Image
                src={NSNC_PIN_IMAGE}
                alt={NSNC_TITLE}
                fill
                className={MAPSITE_LISTING_IMAGE_CLASS}
                sizes="280px"
                priority
              />
            </Link>
            <div className="bg-gradient-to-b from-white/70 to-white/80 px-3.5 pb-3 pt-2">
              <h2 className="m-0 text-[15px] font-semibold leading-tight tracking-tight text-black">{NSNC_TITLE}</h2>
              <p className="m-0 mt-0.5 text-[12px] leading-snug text-neutral-800">{card.body}</p>
              <div className="mt-2.5 grid grid-cols-4 gap-1.5 sm:grid-cols-2">
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
                          href={NSNC_BOOK_HREF}
                          aria-label={card.openEbook}
                          data-testid="demo-hero-pin-action"
                          data-action="teb"
                          className={`${PIN_ACTION_CLASS} transition hover:bg-[#0558b3]`}
                        >
                          {label}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          data-testid="demo-hero-pin-action"
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
