"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import MapEngineCanvas from "@/components/talismaps/map-engine/MapEngineCanvas";
import MapEngineFitBounds from "@/components/talismaps/map-engine/MapEngineFitBounds";
import {
  MapEngineProvider,
  useMapEngine,
} from "@/components/talismaps/map-engine/MapEngineProvider";
import {
  TALISU_MKTS_DO_MORE_PIN_SIZE,
  TALISU_MKTS_FIT_PADDING,
  TALISU_MKTS_MARKET_PIN_SIZE,
  TALISU_MKTS_PINS,
  localizeTalisUMktsPins,
  TALISU_MKTS_VIEWPORT,
  talisuMktsMapCoordinates,
  talisuMktsToEnginePins,
  type TalisUMktsPin,
} from "@/lib/talisu/markets-pins";
import {
  computeMktsPinCardPlacement,
  MKTS_PIN_CARD_EST_HEIGHT_PX,
  MKTS_PIN_CARD_MAX_WIDTH_PX,
  type MktsPinCardPlacement,
} from "@/lib/talisu/mkts-pin-card-layout";
import TalisUMarketsPinCard from "./TalisUMarketsPinCard";
import TalisUMarketsSidebar from "./TalisUMarketsSidebar";
import { useT } from "@/lib/i18n/client";
import {
  TALISU_MKTS_PLACE_SEARCH_ZOOM,
  type MktsSearchOrigin,
} from "@/lib/talisu/mkts-place-search";

const FOCUS_GESTURE_GUARD_MS = 900;
/** Retry window while Google overlays settle after a camera move. */
const PIN_ANCHOR_POLL_MS = 800;

export default function TalisUMarketsMapApp() {
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [searchOrigin, setSearchOrigin] = useState<MktsSearchOrigin | null>(
    null,
  );
  const focusingRef = useRef(false);
  const focusTimerRef = useRef<number | null>(null);
  /** Sidebar (or other) focus asked for a camera move; map clicks do not. */
  const recenterOnSelectRef = useRef(false);
  const t = useT();
  const pins = useMemo(
    () => localizeTalisUMktsPins(TALISU_MKTS_PINS, t.markets),
    [t],
  );
  // Engine pins keep the first-render labels (map re-init is avoided on switch).
  const enginePins = useMemo(() => talisuMktsToEnginePins(pins), [pins]);
  const fitCoordinates = useMemo(() => talisuMktsMapCoordinates(), []);
  const fitPadding = useMemo(
    () => ({
      top: TALISU_MKTS_FIT_PADDING.top,
      right: TALISU_MKTS_FIT_PADDING.right,
      bottom: TALISU_MKTS_FIT_PADDING.bottom,
      left: TALISU_MKTS_FIT_PADDING.left,
    }),
    [],
  );

  const beginFocusGuard = useCallback(() => {
    focusingRef.current = true;
    if (focusTimerRef.current != null) {
      window.clearTimeout(focusTimerRef.current);
    }
    focusTimerRef.current = window.setTimeout(() => {
      focusingRef.current = false;
      focusTimerRef.current = null;
    }, FOCUS_GESTURE_GUARD_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (focusTimerRef.current != null) {
        window.clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  const dismissIfUserGesture = useCallback(() => {
    if (focusingRef.current) return;
    setSelectedPinId(null);
  }, []);

  return (
    <MapEngineProvider
      providerId="google-maps"
      initialPins={enginePins}
      initialViewport={TALISU_MKTS_VIEWPORT}
      selectedPinId={selectedPinId}
      draggablePinIds={[]}
      onPinSelect={(pinId) => {
        // Map click: open the card on the pin where it is — do not shove the
        // camera (that made the pin appear to follow a fixed card).
        recenterOnSelectRef.current = false;
        setSelectedPinId(pinId);
      }}
      onMapClick={() => dismissIfUserGesture()}
      onMapDragStart={dismissIfUserGesture}
      onMapZoom={dismissIfUserGesture}
      basemapView="satellite"
      scrollZoom={false}
      preserveViewport
    >
      <MapEngineFitBounds coordinates={fitCoordinates} padding={fitPadding} />
      <MarketsChrome
        pins={pins}
        footer={t.markets.footer}
        selectedPinId={selectedPinId}
        setSelectedPinId={setSelectedPinId}
        beginFocusGuard={beginFocusGuard}
        recenterOnSelectRef={recenterOnSelectRef}
        searchOrigin={searchOrigin}
        setSearchOrigin={setSearchOrigin}
      />
    </MapEngineProvider>
  );
}

function MarketsChrome({
  pins,
  footer,
  selectedPinId,
  setSelectedPinId,
  beginFocusGuard,
  recenterOnSelectRef,
  searchOrigin,
  setSearchOrigin,
}: {
  pins: readonly TalisUMktsPin[];
  footer: string;
  selectedPinId: string | null;
  setSelectedPinId: (id: string | null) => void;
  beginFocusGuard: () => void;
  recenterOnSelectRef: MutableRefObject<boolean>;
  searchOrigin: MktsSearchOrigin | null;
  setSearchOrigin: (origin: MktsSearchOrigin | null) => void;
}) {
  const { setViewport } = useMapEngine();
  const lastFocusedRef = useRef<string | null>(null);
  const mapRootRef = useRef<HTMLDivElement>(null);
  const cardBodyRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<MktsPinCardPlacement | null>(
    null,
  );
  const [cardHeight, setCardHeight] = useState(MKTS_PIN_CARD_EST_HEIGHT_PX);

  const selectedPin = useMemo(
    () => pins.find((pin) => pin.id === selectedPinId) ?? null,
    [pins, selectedPinId],
  );

  useEffect(() => {
    setPlacement(null);
  }, [selectedPinId]);

  const focusPin = useCallback(
    (pinId: string) => {
      const pin = TALISU_MKTS_PINS.find((item) => item.id === pinId);
      if (!pin) return;
      beginFocusGuard();
      lastFocusedRef.current = pinId;
      recenterOnSelectRef.current = true;
      setViewport({
        center: { latitude: pin.latitude, longitude: pin.longitude },
        zoom: pin.mapZoom,
      });
      setSelectedPinId(pinId);
    },
    [beginFocusGuard, recenterOnSelectRef, setSelectedPinId, setViewport],
  );

  const handlePlaceSearch = useCallback(
    (origin: MktsSearchOrigin) => {
      beginFocusGuard();
      setSearchOrigin(origin);
      setSelectedPinId(null);
      setViewport({
        center: { latitude: origin.latitude, longitude: origin.longitude },
        zoom: TALISU_MKTS_PLACE_SEARCH_ZOOM,
      });
    },
    [beginFocusGuard, setSearchOrigin, setSelectedPinId, setViewport],
  );

  const handlePlaceSearchClear = useCallback(() => {
    setSearchOrigin(null);
  }, [setSearchOrigin]);

  useEffect(() => {
    if (!selectedPinId) {
      lastFocusedRef.current = null;
      return;
    }
    if (lastFocusedRef.current === selectedPinId) return;
    if (!recenterOnSelectRef.current) {
      // Map click already left the pin in place.
      lastFocusedRef.current = selectedPinId;
      return;
    }
    const pin = TALISU_MKTS_PINS.find((item) => item.id === selectedPinId);
    if (!pin) return;
    beginFocusGuard();
    setViewport({
      center: { latitude: pin.latitude, longitude: pin.longitude },
      zoom: pin.mapZoom,
    });
    lastFocusedRef.current = selectedPinId;
    recenterOnSelectRef.current = false;
  }, [
    selectedPinId,
    beginFocusGuard,
    recenterOnSelectRef,
    setViewport,
  ]);

  const syncPlacement = useCallback(() => {
    const root = mapRootRef.current;
    if (!root || !selectedPin) return;

    const rootRect = root.getBoundingClientRect();
    const marker =
      root.querySelector<HTMLElement>(".talismaps-pin-icon--highlighted") ??
      root.querySelector<HTMLElement>(".talismaps-pin--selected")?.closest(
        ".talismaps-pin-icon",
      ) ??
      null;

    let pinX = rootRect.width / 2;
    let pinY = rootRect.height / 2;
    if (marker) {
      const markerRect = marker.getBoundingClientRect();
      pinX = markerRect.left + markerRect.width / 2 - rootRect.left;
      pinY = markerRect.top + markerRect.height / 2 - rootRect.top;
    }

    const pinRadius =
      (selectedPin.kind === "do-more"
        ? TALISU_MKTS_DO_MORE_PIN_SIZE
        : TALISU_MKTS_MARKET_PIN_SIZE) / 2;

    const measuredHeight =
      cardBodyRef.current?.getBoundingClientRect().height ?? cardHeight;
    if (
      measuredHeight > 0 &&
      Math.abs(measuredHeight - cardHeight) > 1
    ) {
      setCardHeight(measuredHeight);
    }

    const next = computeMktsPinCardPlacement({
      pinX,
      pinY,
      rootWidth: rootRect.width,
      rootHeight: rootRect.height,
      cardWidth: Math.min(MKTS_PIN_CARD_MAX_WIDTH_PX, rootRect.width * 0.92),
      cardHeight: measuredHeight > 0 ? measuredHeight : cardHeight,
      pinRadius,
    });

    setPlacement((prev) =>
      prev &&
      prev.left === next.left &&
      prev.top === next.top &&
      prev.placement === next.placement
        ? prev
        : next,
    );
  }, [selectedPin, cardHeight]);

  useEffect(() => {
    if (!selectedPinId) return;
    const root = mapRootRef.current;
    if (!root) return;

    let cancelled = false;
    let raf = 0;
    const started = performance.now();

    const tick = () => {
      if (cancelled) return;
      syncPlacement();
      if (performance.now() - started < PIN_ANCHOR_POLL_MS) {
        raf = window.requestAnimationFrame(tick);
      }
    };
    raf = window.requestAnimationFrame(tick);

    const observer = new ResizeObserver(() => syncPlacement());
    observer.observe(root);
    window.addEventListener("resize", syncPlacement);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", syncPlacement);
    };
  }, [selectedPinId, syncPlacement]);

  useEffect(() => {
    if (!selectedPinId || !placement) return;
    const body = cardBodyRef.current;
    if (!body) return;
    const observer = new ResizeObserver(() => syncPlacement());
    observer.observe(body);
    return () => observer.disconnect();
  }, [selectedPinId, placement, syncPlacement]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-neutral-900">
      <div
        ref={mapRootRef}
        className="relative min-h-0 flex-1 overflow-hidden"
      >
        <MapEngineCanvas className="h-full w-full" />

        <TalisUMarketsSidebar
          pins={pins}
          selectedPinId={selectedPinId}
          onSelectPin={focusPin}
          onPlaceSearch={handlePlaceSearch}
          onPlaceSearchClear={handlePlaceSearchClear}
          searchOrigin={searchOrigin}
        />

        {selectedPin && placement ? (
          <TalisUMarketsPinCard
            pin={selectedPin}
            onClose={() => setSelectedPinId(null)}
            left={placement.left}
            top={placement.top}
            placement={placement.placement}
            cardBodyRef={cardBodyRef}
          />
        ) : null}
      </div>

      <footer className="shrink-0 border-t border-black/10 bg-white px-4 py-3 text-center text-[12px] leading-snug text-neutral-700 sm:px-6 sm:text-[13px]">
        {footer}
      </footer>
    </div>
  );
}
