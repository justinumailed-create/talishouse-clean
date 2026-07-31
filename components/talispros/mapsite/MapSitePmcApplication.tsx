"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import MapEngineCanvas from "@/components/talismaps/map-engine/MapEngineCanvas";
import {
  MapEngineProvider,
  useMapEngine,
} from "@/components/talismaps/map-engine/MapEngineProvider";
import type { RegistrationMarket } from "@/lib/registration-market";
import {
  PMC_MAP_VIEWPORT,
  pmcPinEntryWorkflow,
  pmcPinsByRegionGroup,
  pmcPinsToMapEnginePins,
  type PmcRegionalPin,
  type PmcRegionGroup,
} from "@/lib/talispros/pmc-regional-pins";
import { DEMO_MAPSITE_ID, MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";
import MapSitePmcPinPopup from "./MapSitePmcPinPopup";
import MapSitePmcSidebar from "./MapSitePmcSidebar";

const FOCUS_GESTURE_GUARD_MS = 900;

interface MapSitePmcApplicationProps {
  pins: PmcRegionalPin[];
  audience: RegistrationMarket;
  canEdit?: boolean;
}

export default function MapSitePmcApplication({
  pins,
  audience,
  canEdit = false,
}: MapSitePmcApplicationProps) {
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const focusingRef = useRef(false);
  const focusTimerRef = useRef<number | null>(null);

  const enginePins = useMemo(() => pmcPinsToMapEnginePins(pins), [pins]);

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
      initialViewport={PMC_MAP_VIEWPORT}
      selectedPinId={selectedPinId}
      draggablePinIds={[]}
      onPinSelect={(pinId) => setSelectedPinId(pinId)}
      onMapClick={() => dismissIfUserGesture()}
      onMapDragStart={dismissIfUserGesture}
      onMapZoom={dismissIfUserGesture}
      basemapView="satellite"
    >
      <MapSitePmcChrome
        pins={pins}
        audience={audience}
        canEdit={canEdit}
        selectedPinId={selectedPinId}
        setSelectedPinId={setSelectedPinId}
        beginFocusGuard={beginFocusGuard}
      />
    </MapEngineProvider>
  );
}

function MapSitePmcChrome({
  pins,
  audience,
  canEdit,
  selectedPinId,
  setSelectedPinId,
  beginFocusGuard,
}: {
  pins: PmcRegionalPin[];
  audience: RegistrationMarket;
  canEdit: boolean;
  selectedPinId: string | null;
  setSelectedPinId: (id: string | null) => void;
  beginFocusGuard: () => void;
}) {
  const { setViewport } = useMapEngine();
  const rootRef = useRef<HTMLDivElement>(null);
  const [rootHeight, setRootHeight] = useState(800);
  const lastFocusedRef = useRef<string | null>(null);

  const selectedPin = useMemo(
    () => pins.find((pin) => pin.id === selectedPinId) ?? null,
    [pins, selectedPinId]
  );

  const focusPin = useCallback(
    (pinId: string) => {
      const pin = pins.find((item) => item.id === pinId);
      if (!pin || !pin.visible) return;
      beginFocusGuard();
      lastFocusedRef.current = pinId;
      setViewport({
        center: { latitude: pin.latitude, longitude: pin.longitude },
        zoom: pin.mapZoom,
      });
      setSelectedPinId(pinId);
    },
    [beginFocusGuard, pins, setSelectedPinId, setViewport]
  );

  const focusRegion = useCallback(
    (group: PmcRegionGroup) => {
      const regionPins = pmcPinsByRegionGroup(pins, group);
      if (regionPins.length === 0) return;
      beginFocusGuard();
      lastFocusedRef.current = null;
      setSelectedPinId(null);
      if (group === "usa") {
        const usa = regionPins[0];
        setViewport({
          center: { latitude: usa.latitude, longitude: usa.longitude },
          zoom: 4,
        });
        return;
      }
      setViewport({
        center: { latitude: 56.0, longitude: -96.0 },
        zoom: 4,
      });
    },
    [beginFocusGuard, pins, setSelectedPinId, setViewport]
  );

  useEffect(() => {
    if (!selectedPinId) {
      lastFocusedRef.current = null;
      return;
    }
    if (lastFocusedRef.current === selectedPinId) return;
    const pin = pins.find((item) => item.id === selectedPinId);
    if (!pin) return;
    beginFocusGuard();
    setViewport({
      center: { latitude: pin.latitude, longitude: pin.longitude },
      zoom: pin.mapZoom,
    });
    lastFocusedRef.current = selectedPinId;
  }, [selectedPinId, pins, beginFocusGuard, setViewport]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const sync = () => setRootHeight(root.getBoundingClientRect().height);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const actionHref = useMemo(() => {
    if (selectedPin && pmcPinEntryWorkflow(selectedPin) === "corporate-admin-auth") {
      return "/talispros/admin/login";
    }
    const params = new URLSearchParams({
      audience,
      mapsiteId: DEMO_MAPSITE_ID,
      returnTo: `${MAPSITE_APP_PATH}?view=pin&audience=${audience}`,
    });
    if (selectedPin) {
      params.set("region", selectedPin.id);
      params.set("regionLabel", selectedPin.label);
    }
    return `/talispros/markets/claim-a-market?${params.toString()}`;
  }, [audience, selectedPin]);

  return (
    <div
      ref={rootRef}
      className="relative h-dvh w-screen overflow-hidden bg-neutral-900"
    >
      <MapEngineCanvas className="h-full w-full" />

      <MapSitePmcSidebar
        pins={pins}
        selectedPinId={selectedPinId}
        onSelectPin={focusPin}
        onFocusRegion={focusRegion}
      />

      {selectedPin ? (
        <MapSitePmcPinPopup
          pin={selectedPin}
          actionHref={actionHref}
          rootHeight={rootHeight}
          onClose={() => setSelectedPinId(null)}
        />
      ) : null}

      {canEdit ? (
        <Link
          href="/talispros/admin/pmc"
          className="absolute right-3 top-3 z-30 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 shadow-[0_8px_24px_rgba(0,0,0,0.16)] ring-1 ring-black/5 transition hover:bg-neutral-50 sm:right-4 sm:top-4"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          Edit
        </Link>
      ) : null}
    </div>
  );
}
