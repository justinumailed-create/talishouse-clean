"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import MapEngineFitBounds from "@/components/talismaps/map-engine/MapEngineFitBounds";
import { MapEngineProvider } from "@/components/talismaps/map-engine/MapEngineProvider";
import { useT } from "@/lib/i18n/client";
import {
  HOME_MARKET_MAP_PINS,
  HOME_MARKET_VIEWPORT,
  homeMarketEnginePins,
  homeMarketFitCoordinates,
  type HomeMarketPin,
} from "@/lib/talisu/north-america-markets";

const MapEngineCanvas = dynamic(
  () => import("@/components/talismaps/map-engine/MapEngineCanvas"),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-[#e7eef6]" aria-hidden />,
  },
);

const FIT_PADDING = { top: 56, right: 40, bottom: 56, left: 40 } as const;

/**
 * North American Markets map: 15 Canada + 30 US market PINs and the one
 * Talishouse™ PIN. A market PIN opens a small card whose only action is
 * Personalize (a straight link into claiming that market, no Aisha script).
 */
export default function HomeMarketMap({
  onPersonalize,
}: {
  onPersonalize: (market: HomeMarketPin) => void;
}) {
  const t = useT().homeMarket;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const enginePins = useMemo(() => homeMarketEnginePins(), []);
  const fit = useMemo(() => homeMarketFitCoordinates(), []);
  const selected = HOME_MARKET_MAP_PINS.find((pin) => pin.id === selectedId) ?? null;

  return (
    <div className="relative h-full w-full" data-testid="home-market-map" aria-label={t.mapLabel}>
      <MapEngineProvider
        providerId="google-maps"
        initialPins={enginePins}
        initialViewport={HOME_MARKET_VIEWPORT}
        selectedPinId={selectedId}
        draggablePinIds={[]}
        onPinSelect={(pinId) => setSelectedId(pinId)}
        onMapClick={() => setSelectedId(null)}
        basemapView="satellite"
        scrollZoom={false}
        preserveViewport
      >
        <MapEngineFitBounds coordinates={fit} padding={FIT_PADDING} />
        <MapEngineCanvas className="h-full w-full" />
      </MapEngineProvider>

      {selected ? (
        <MarketCard
          pin={selected}
          onClose={() => setSelectedId(null)}
          onPersonalize={() => onPersonalize(selected)}
        />
      ) : null}
    </div>
  );
}

function MarketCard({
  pin,
  onClose,
  onPersonalize,
}: {
  pin: HomeMarketPin;
  onClose: () => void;
  onPersonalize: () => void;
}) {
  const t = useT().homeMarket;
  const market = pin.kind === "market";
  return (
    <article
      className="absolute left-1/2 top-4 z-10 w-[min(92%,20rem)] -translate-x-1/2 overflow-hidden rounded-2xl bg-white/95 shadow-[0_14px_40px_rgba(0,0,0,0.3)] ring-1 ring-black/5 backdrop-blur-sm"
      data-testid="home-market-card"
      data-market-id={pin.id}
    >
      <div className="flex items-start gap-3 px-4 pb-3 pt-4">
        <span className="relative mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-[#CC8800]">
          <Image src={pin.flagUrl} alt="" fill sizes="36px" className="object-contain p-1" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            {pin.country === "US" ? t.usa : t.canada}
          </p>
          <h3 className="m-0 mt-0.5 text-[16px] font-semibold leading-snug text-neutral-950">{pin.name}</h3>
          {pin.anchor ? (
            <p className="m-0 mt-0.5 text-[13px] leading-snug text-neutral-600">{pin.anchor}</p>
          ) : null}
          {!market ? (
            <p className="m-0 mt-1.5 text-[13px] leading-snug text-neutral-700">{t.talishouseBody}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-full text-[20px] leading-none text-neutral-500 hover:bg-neutral-100"
        >
          ×
        </button>
      </div>
      <div className="px-4 pb-4">
        {market ? (
          <button
            type="button"
            onClick={onPersonalize}
            data-testid="home-market-personalize"
            className="flex h-11 w-full items-center justify-center rounded-full bg-[#046BD9] text-[15px] font-semibold text-white shadow-[0_6px_14px_rgba(4,107,217,0.3)] transition hover:bg-[#0558b3]"
          >
            {t.personalize}
          </button>
        ) : (
          <Link
            href="/catalogue"
            className="flex h-11 w-full items-center justify-center rounded-full bg-neutral-950 text-[15px] font-semibold text-white transition hover:bg-neutral-800"
          >
            {t.catalogue}
          </Link>
        )}
      </div>
    </article>
  );
}
