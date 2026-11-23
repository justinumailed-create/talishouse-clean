"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import MapEngineFitBounds from "@/components/talismaps/map-engine/MapEngineFitBounds";
import { MapEngineProvider, useMapEngine } from "@/components/talismaps/map-engine/MapEngineProvider";
import { HomeMarketZoomControls } from "@/components/talispros/home-market/HomeMarketMap";
import { useT } from "@/lib/i18n/client";
import type { MapEnginePin } from "@/lib/talismaps/map-engine/types";
import { HOME_MARKET_NORTH_AMERICA_FIT } from "@/lib/talisu/north-america-markets";
import type { MarketsMapsitePin } from "@/lib/talisu/markets-mapsites.server";

const MapEngineCanvas = dynamic(
  () => import("@/components/talismaps/map-engine/MapEngineCanvas"),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-[#e7eef6]" aria-hidden />,
  },
);

const FIT_PADDING = { top: 60, right: 60, bottom: 60, left: 60 } as const;

function enginePin(pin: MarketsMapsitePin): MapEnginePin {
  return {
    id: pin.id,
    latitude: pin.latitude,
    longitude: pin.longitude,
    color: "#046BD9",
    featured: false,
    metadata: {
      icon: "dot",
      whiteCenter: true,
      pinBorderColor: "#046BD9",
      pinSize: 30,
      animated: false,
      label: pin.title,
    },
  };
}

function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

/**
 * Markets → Mapsites Built (Ralf, Nov 23): every built Mapsite on one map.
 * Selecting a PIN (on the map or in the list) opens its account and CRM.
 */
export default function MarketsMapsitesMap({ pins }: { pins: MarketsMapsitePin[] }) {
  const t = useT().markets.built;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const enginePins = useMemo(() => pins.map(enginePin), [pins]);
  const fit = useMemo(
    () => (pins.length ? pins.map((pin) => ({ latitude: pin.latitude, longitude: pin.longitude })) : [...HOME_MARKET_NORTH_AMERICA_FIT]),
    [pins],
  );
  const selected = pins.find((pin) => pin.id === selectedId) ?? null;

  return (
    <MapEngineProvider
      providerId="google-maps"
      initialPins={enginePins}
      initialViewport={{ center: { latitude: 48, longitude: -98 }, zoom: 3 }}
      selectedPinId={selectedId}
      draggablePinIds={[]}
      onPinSelect={(pinId) => setSelectedId(pinId)}
      onMapClick={() => setSelectedId(null)}
      basemapView="satellite"
      scrollZoom={false}
      preserveViewport
    >
      <MapEngineFitBounds coordinates={fit} padding={FIT_PADDING} />
      <div
        className="flex min-h-0 flex-1 flex-col bg-white lg:grid lg:grid-cols-[22rem_1fr] lg:overflow-hidden"
        data-testid="markets-mapsites"
        data-count={pins.length}
      >
        <aside className="order-2 flex min-h-0 flex-col border-t border-neutral-200 lg:order-1 lg:border-r lg:border-t-0">
          <div className="px-5 py-4">
            <h1 className="m-0 text-[20px] font-semibold text-neutral-950">{t.title}</h1>
            <p className="m-0 mt-1 text-[13px] leading-snug text-neutral-600">{t.subtitle}</p>
            <p className="m-0 mt-2 text-[13px] font-semibold text-[#046BD9]" data-testid="markets-mapsites-count">
              {t.count.replace("{count}", String(pins.length))}
            </p>
          </div>
          {pins.length === 0 ? (
            <p className="m-0 px-5 pb-5 text-[14px] text-neutral-600">{t.empty}</p>
          ) : (
            <ListOfPins pins={pins} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </aside>
        <section className="relative order-1 h-[60dvh] min-h-[20rem] lg:order-2 lg:h-auto" aria-label={t.mapLabel}>
          <MapEngineCanvas className="h-full w-full" />
          <HomeMarketZoomControls />
          {selected ? <PinCard pin={selected} onClose={() => setSelectedId(null)} /> : null}
        </section>
      </div>
    </MapEngineProvider>
  );
}

function ListOfPins({
  pins,
  selectedId,
  onSelect,
}: {
  pins: MarketsMapsitePin[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { setViewport, viewport } = useMapEngine();
  return (
    <ul className="m-0 min-h-0 list-none overflow-y-auto p-0 pb-4 lg:flex-1" data-testid="markets-mapsites-list">
      {pins.map((pin) => (
        <li key={pin.id}>
          <button
            type="button"
            onClick={() => {
              onSelect(pin.id);
              setViewport({
                center: { latitude: pin.latitude, longitude: pin.longitude },
                zoom: Math.max(viewport.zoom, 9),
              });
            }}
            className={`block w-full border-b border-neutral-100 px-5 py-2.5 text-left transition hover:bg-neutral-50 ${
              pin.id === selectedId ? "bg-[#046BD9]/5" : ""
            }`}
          >
            <span className="block text-[14px] font-semibold text-neutral-950">{pin.title}</span>
            <span className="block text-[12px] text-neutral-500">
              {pin.fastCode}
              {pin.address ? ` · ${pin.address}` : ""}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function PinCard({ pin, onClose }: { pin: MarketsMapsitePin; onClose: () => void }) {
  const t = useT().markets.built;
  const built = formatDate(pin.createdAt);
  return (
    <article
      className="absolute left-1/2 top-4 w-[min(92%,22rem)] -translate-x-1/2 overflow-hidden rounded-2xl bg-white shadow-[0_14px_40px_rgba(0,0,0,0.3)] ring-1 ring-black/5"
      style={{ zIndex: 31 }}
      data-testid="markets-mapsites-card"
      data-fast-code={pin.fastCode}
    >
      <div className="flex items-start gap-3 px-4 pb-2 pt-4">
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#046BD9]">{pin.accountType || t.title}</p>
          <h3 className="m-0 mt-0.5 text-[16px] font-semibold leading-snug text-neutral-950">{pin.title}</h3>
          {pin.owner && pin.owner !== pin.title ? <p className="m-0 text-[13px] text-neutral-700">{pin.owner}</p> : null}
          {pin.address ? <p className="m-0 mt-0.5 text-[13px] leading-snug text-neutral-600">{pin.address}</p> : null}
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
      <dl className="m-0 grid grid-cols-3 gap-2 px-4 pb-3 text-[12px]">
        <div>
          <dt className="text-neutral-500">{t.fastCode}</dt>
          <dd className="m-0 font-semibold text-neutral-900">{pin.fastCode}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">{t.status}</dt>
          <dd className="m-0 font-semibold capitalize text-neutral-900">{pin.status}</dd>
        </div>
        {built ? (
          <div>
            <dt className="text-neutral-500">{t.built}</dt>
            <dd className="m-0 font-semibold text-neutral-900">{built}</dd>
          </div>
        ) : null}
      </dl>
      <div className="grid gap-2 px-4 pb-4">
        <Link
          href={pin.accountHref}
          data-testid="markets-mapsites-account"
          className="flex h-10 items-center justify-center rounded-full bg-[#046BD9] text-[14px] font-semibold text-white hover:bg-[#0558b3]"
        >
          {t.openAccount}
        </Link>
        <Link
          href={pin.crmHref}
          data-testid="markets-mapsites-crm"
          data-matched={pin.crmMatched ? "true" : "false"}
          className="flex h-10 items-center justify-center rounded-full border border-neutral-300 text-[14px] font-semibold text-neutral-900 hover:bg-neutral-50"
        >
          {pin.crmMatched ? t.openCrm : t.findInCrm}
        </Link>
      </div>
    </article>
  );
}
