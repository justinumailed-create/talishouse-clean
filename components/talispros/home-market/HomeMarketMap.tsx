"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import GoogleAddressInput from "@/components/build-mapsite/GoogleAddressInput";
import MapEngineFitBounds from "@/components/talismaps/map-engine/MapEngineFitBounds";
import { MapEngineProvider, useMapEngine } from "@/components/talismaps/map-engine/MapEngineProvider";
import { useT } from "@/lib/i18n/client";
import { WEBSTER_BOOK_COVER, WEBSTER_BOOK_HREF } from "@/lib/talispros/webster-book";
import {
  HOME_MARKET_NORTH_AMERICA_FIT,
  HOME_MARKET_PLACED_ZOOM,
  HOME_MARKET_TALISHOUSE_PIN,
  HOME_MARKET_VIEWPORT,
  homeMarketPublicEnginePins,
  placedHomeMarket,
  type HomeMarketPin,
} from "@/lib/talisu/north-america-markets";

const MapEngineCanvas = dynamic(
  () => import("@/components/talismaps/map-engine/MapEngineCanvas"),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-[#e7eef6]" aria-hidden />,
  },
);

const FIT_PADDING = { top: 72, right: 40, bottom: 40, left: 40 } as const;
const MIN_ZOOM = 2;
const MAX_ZOOM = 20;

type GeocodeResult = { found?: boolean; latitude?: string | number; longitude?: string | number; address?: string };

async function geocode(query: string): Promise<GeocodeResult | null> {
  try {
    const response = await fetch(query, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as GeocodeResult;
  } catch {
    return null;
  }
}

/**
 * Public Mapsites map (Ralf, Nov 23). No fixed market PINs: one old regional
 * PIN covered many Home Markets of about 100,000 people. The visitor places
 * their own PIN (address or postal code search, or a tap on the map), which
 * becomes the centre of their Home Market, then Personalize continues the
 * Build Mapsite flow. The Talishouse™ (Windswept) PIN opens Webster's
 * Income Units book, with the Catalogue as the next step.
 */
export default function HomeMarketMap({
  placed,
  onPlace,
  onPersonalize,
}: {
  placed: HomeMarketPin | null;
  onPlace: (market: HomeMarketPin | null) => void;
  onPersonalize: (market: HomeMarketPin) => void;
}) {
  const t = useT().homeMarket;
  const [selectedId, setSelectedId] = useState<string | null>(placed?.id ?? null);
  const enginePins = useMemo(() => homeMarketPublicEnginePins(placed), [placed]);
  const draggable = useMemo(() => (placed ? [placed.id] : []), [placed]);
  const initialViewport = useMemo(
    () =>
      placed
        ? { center: { latitude: placed.latitude, longitude: placed.longitude }, zoom: HOME_MARKET_PLACED_ZOOM }
        : HOME_MARKET_VIEWPORT,
    // Only the first placement decides the mount view; later moves pan the live map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const lookupRef = useRef(0);

  const placeAt = useCallback(
    async (latitude: number, longitude: number, address?: string) => {
      const lookup = ++lookupRef.current;
      const market = placedHomeMarket({ latitude, longitude, address: address ?? "" });
      if (!market) return;
      onPlace(market);
      setSelectedId(market.id);
      if (address) return;
      const result = await geocode(
        `/api/talismaps/geocode?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,
      );
      if (lookup !== lookupRef.current || !result?.found || !result.address) return;
      const named = placedHomeMarket({ latitude, longitude, address: result.address });
      if (named) {
        onPlace(named);
        setSelectedId(named.id);
      }
    },
    [onPlace],
  );

  const selectedTalishouse = selectedId !== null && selectedId === HOME_MARKET_TALISHOUSE_PIN?.id;
  const selectedPlaced = placed && selectedId === placed.id ? placed : null;

  return (
    <div className="relative h-full w-full" data-testid="home-market-map" aria-label={t.mapLabel}>
      <MapEngineProvider
        providerId="google-maps"
        initialPins={enginePins}
        initialViewport={initialViewport}
        selectedPinId={selectedId}
        draggablePinIds={draggable}
        onPinSelect={(pinId) => setSelectedId(pinId)}
        onMapClick={(coordinates) => void placeAt(coordinates.latitude, coordinates.longitude)}
        onPinDrag={(_pinId, coordinates) => void placeAt(coordinates.latitude, coordinates.longitude)}
        basemapView="satellite"
        scrollZoom={false}
        preserveViewport
      >
        {placed ? null : <MapEngineFitBounds coordinates={[...HOME_MARKET_NORTH_AMERICA_FIT]} padding={FIT_PADDING} />}
        <MapEngineCanvas className="h-full w-full" />
        <PlaceSearch hasPin={Boolean(placed)} onPlace={(lat, lng, address) => void placeAt(lat, lng, address)} />
        <FlyToPlaced placed={placed} />
        <HomeMarketZoomControls />
      </MapEngineProvider>

      {selectedTalishouse && HOME_MARKET_TALISHOUSE_PIN ? (
        <TalishouseCard onClose={() => setSelectedId(null)} />
      ) : null}
      {selectedPlaced ? (
        <PlacedCard
          pin={selectedPlaced}
          onClose={() => setSelectedId(null)}
          onPersonalize={() => onPersonalize(selectedPlaced)}
        />
      ) : null}
    </div>
  );
}

/**
 * Map centre that puts the PIN about a fifth of the map height below the
 * middle, so the search box and the card above it never cover the PIN.
 */
function latitudeWithPinLow(latitude: number, zoom: number): number {
  if (typeof document === "undefined") return latitude;
  const height = document.querySelector<HTMLElement>('[data-testid="home-market-map"]')?.clientHeight ?? 0;
  if (!height) return latitude;
  const degreesPerPixel = (360 / (256 * 2 ** zoom)) * Math.cos((latitude * Math.PI) / 180);
  return Math.max(-85, Math.min(85, latitude + height * 0.2 * degreesPerPixel));
}

/** Pans to the visitor's PIN when it is placed or moved from the search box. */
function FlyToPlaced({ placed }: { placed: HomeMarketPin | null }) {
  const { setViewport, viewport, isReady } = useMapEngine();
  const lastRef = useRef<string | null>(null);
  const latitude = placed?.latitude;
  const longitude = placed?.longitude;
  useEffect(() => {
    if (!isReady || latitude === undefined || longitude === undefined) return;
    const key = `${latitude},${longitude}`;
    if (lastRef.current === key) return;
    const first = lastRef.current === null;
    lastRef.current = key;
    const zoom = first ? Math.max(viewport.zoom, HOME_MARKET_PLACED_ZOOM) : viewport.zoom;
    setViewport({ center: { latitude: latitudeWithPinLow(latitude, zoom), longitude }, zoom });
    // viewport is read once per placement, so user zoom is not fought.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, latitude, longitude, setViewport]);
  return null;
}

/** Address / postal code / town search over the map (Canada and the USA). */
function PlaceSearch({
  hasPin,
  onPlace,
}: {
  hasPin: boolean;
  onPlace: (latitude: number, longitude: number, address: string) => void;
}) {
  const t = useT().homeMarket;
  const [query, setQuery] = useState("");
  const [notFound, setNotFound] = useState(false);

  async function searchTyped() {
    const value = query.trim();
    if (value.length < 3) return;
    const result = await geocode(`/api/talismaps/geocode?q=${encodeURIComponent(value)}`);
    const lat = Number(result?.latitude);
    const lng = Number(result?.longitude);
    if (!result?.found || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      setNotFound(true);
      return;
    }
    setNotFound(false);
    onPlace(lat, lng, result.address || value);
  }

  return (
    <div
      className="absolute left-1/2 top-3 w-[min(94%,30rem)] -translate-x-1/2"
      style={{ zIndex: 30 }}
      data-testid="home-market-search"
    >
      <div className="rounded-2xl bg-white/95 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.28)] ring-1 ring-black/5 backdrop-blur-sm">
        <GoogleAddressInput
          id="home-market-place-search"
          inputTestId="home-market-place-search"
          label={t.searchLabel}
          hideLabel
          value={query}
          onChange={(value) => {
            setQuery(value);
            setNotFound(false);
          }}
          onPlaceSelected={(place) => {
            setQuery(place.address);
            setNotFound(false);
            onPlace(Number(place.latitude), Number(place.longitude), place.address);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void searchTyped();
            }
          }}
          placeholder={t.searchPlaceholder}
          placeTypes={["geocode"]}
          countries={["ca", "us"]}
          autoComplete="off"
          ignorePasswordManagers
          fallbackHintText=" "
          inputClassName="h-11 w-full rounded-xl border-0 bg-transparent px-3.5 text-[15px] text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#046BD9]/30"
        />
      </div>
      {notFound || !hasPin ? (
        <p
          className="m-0 mx-auto mt-1.5 w-fit rounded-full bg-black/55 px-3 py-1 text-center text-[12px] font-medium text-white"
          style={{ color: "#fff" }}
          role={notFound ? "alert" : undefined}
        >
          {notFound ? t.searchNotFound : t.searchHint}
        </p>
      ) : null}
    </div>
  );
}

const ZOOM_BUTTON: CSSProperties = {
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

/** Always-visible + / − and "all of North America" buttons (Ralf, Nov 23). */
export function HomeMarketZoomControls() {
  const t = useT().homeMarket;
  const { viewport, setViewport, fitToCoordinates, isReady } = useMapEngine();
  const zoom = viewport.zoom;
  function step(delta: number) {
    setViewport({ center: viewport.center, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom + delta))) });
  }
  return (
    <div
      className="absolute bottom-4 right-3 flex flex-col gap-1.5"
      style={{ zIndex: 30 }}
      data-testid="home-market-zoom-controls"
      data-zoom={zoom}
    >
      <button
        type="button"
        style={{ ...ZOOM_BUTTON, opacity: !isReady || zoom >= MAX_ZOOM ? 0.45 : 1 }}
        aria-label={t.zoomIn}
        title={t.zoomIn}
        data-testid="home-market-zoom-in"
        disabled={!isReady || zoom >= MAX_ZOOM}
        onClick={() => step(1)}
      >
        +
      </button>
      <button
        type="button"
        style={{ ...ZOOM_BUTTON, opacity: !isReady || zoom <= MIN_ZOOM ? 0.45 : 1 }}
        aria-label={t.zoomOut}
        title={t.zoomOut}
        data-testid="home-market-zoom-out"
        disabled={!isReady || zoom <= MIN_ZOOM}
        onClick={() => step(-1)}
      >
        −
      </button>
      <button
        type="button"
        style={{ ...ZOOM_BUTTON, fontSize: 17, opacity: isReady ? 1 : 0.45 }}
        aria-label={t.zoomReset}
        title={t.zoomReset}
        data-testid="home-market-zoom-reset"
        disabled={!isReady}
        onClick={() => fitToCoordinates([...HOME_MARKET_NORTH_AMERICA_FIT], FIT_PADDING)}
      >
        ⤢
      </button>
    </div>
  );
}

const CARD_CLASS =
  "absolute left-1/2 top-[6.75rem] w-[min(92%,21rem)] -translate-x-1/2 overflow-hidden rounded-2xl bg-white/95 shadow-[0_14px_40px_rgba(0,0,0,0.3)] ring-1 ring-black/5 backdrop-blur-sm";

function CloseButton({ onClose }: { onClose: () => void }) {
  const t = useT().homeMarket;
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={t.close}
      className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[20px] leading-none text-neutral-500 hover:bg-neutral-100"
    >
      ×
    </button>
  );
}

/** The visitor's own PIN: their Home Market, then Personalize. */
function PlacedCard({
  pin,
  onClose,
  onPersonalize,
}: {
  pin: HomeMarketPin;
  onClose: () => void;
  onPersonalize: () => void;
}) {
  const t = useT().homeMarket;
  return (
    <article className={CARD_CLASS} style={{ zIndex: 31 }} data-testid="home-market-card" data-market-id={pin.id}>
      <div className="flex items-start gap-3 px-4 pb-3 pt-4">
        <span className="relative mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-[#046BD9]">
          <Image src={pin.flagUrl} alt="" fill sizes="36px" className="object-contain p-1" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#046BD9]">{t.yourHomeMarket}</p>
          <h3 className="m-0 mt-0.5 text-[16px] font-semibold leading-snug text-neutral-950" data-testid="home-market-card-place">
            {pin.name}
          </h3>
          <p className="m-0 mt-1 text-[13px] leading-snug text-neutral-600">{t.placedBody}</p>
        </div>
        <CloseButton onClose={onClose} />
      </div>
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={onPersonalize}
          data-testid="home-market-personalize"
          className="flex h-11 w-full items-center justify-center rounded-full bg-[#046BD9] text-[15px] font-semibold text-white shadow-[0_6px_14px_rgba(4,107,217,0.3)] transition hover:bg-[#0558b3]"
        >
          {t.personalize}
        </button>
        <p className="m-0 mt-2 text-center text-[12px] text-neutral-500">{t.movePinHint}</p>
      </div>
    </article>
  );
}

/** Talishouse™ (Windswept) PIN: Webster's book first, the Catalogue next (Ralf, Nov 23). */
function TalishouseCard({ onClose }: { onClose: () => void }) {
  const t = useT().homeMarket;
  return (
    <article
      className={CARD_CLASS}
      style={{ zIndex: 31 }}
      data-testid="home-market-talishouse-card"
      data-market-id={HOME_MARKET_TALISHOUSE_PIN?.id}
    >
      <div className="flex items-start gap-3 px-4 pb-2 pt-4">
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">{t.websterKicker}</p>
          <h3 className="m-0 mt-0.5 text-[16px] font-semibold leading-snug text-neutral-950">{t.websterTitle}</h3>
          <p className="m-0 mt-1 text-[13px] leading-snug text-neutral-700">{t.talishouseBody}</p>
        </div>
        <CloseButton onClose={onClose} />
      </div>
      <Link
        href={WEBSTER_BOOK_HREF}
        className="relative mx-4 block aspect-[792/612] overflow-hidden rounded-xl ring-1 ring-black/10"
        aria-label={t.websterOpen}
      >
        <Image src={WEBSTER_BOOK_COVER} alt={t.websterTitle} fill sizes="320px" className="object-cover" />
      </Link>
      <div className="grid gap-2 px-4 pb-4 pt-3">
        <Link
          href={WEBSTER_BOOK_HREF}
          data-testid="home-market-webster-book"
          className="flex h-11 w-full items-center justify-center rounded-full bg-neutral-950 text-[15px] font-semibold text-white transition hover:bg-neutral-800"
        >
          {t.websterOpen}
        </Link>
        <Link
          href="/catalogue"
          data-testid="home-market-catalogue"
          className="flex h-10 w-full items-center justify-center rounded-full border border-neutral-300 bg-white text-[14px] font-semibold text-neutral-900 transition hover:bg-neutral-50"
        >
          {t.seeCatalogue}
        </Link>
      </div>
    </article>
  );
}
