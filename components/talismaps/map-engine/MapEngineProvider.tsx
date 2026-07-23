"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_MAP_BASEMAP_VIEW,
  DEFAULT_MAP_PROVIDER_ID,
} from "@/lib/talismaps/map-engine";
import type {
  MapBasemapView,
  MapCoordinates,
  MapEnginePin,
  MapInstance,
  MapProviderId,
  MapViewport,
} from "@/lib/talismaps/map-engine/types";
import { pinStyleCacheKey } from "@/lib/talismaps/map-engine/pin-marker-icon";

const DEFAULT_VIEWPORT: MapViewport = {
  center: { latitude: 43.6532, longitude: -79.3832 },
  zoom: 11,
};

interface MapEngineContextValue {
  providerId: MapProviderId;
  basemapView: MapBasemapView;
  pins: MapEnginePin[];
  selectedPinId: string | null;
  draggablePinIds: string[];
  viewport: MapViewport;
  isReady: boolean;
  lockCenter: boolean;
  setProviderId: (providerId: MapProviderId) => void;
  setBasemapView: (view: MapBasemapView) => void;
  setPins: (pins: MapEnginePin[]) => void;
  setSelectedPinId: (pinId: string | null) => void;
  setDraggablePinIds: (pinIds: string[]) => void;
  setViewport: (viewport: MapViewport) => void;
  setReady: (ready: boolean) => void;
  registerMapInstance: (instance: MapInstance | null) => void;
  fitToCoordinates: (coordinates: MapCoordinates[], padding?: number) => void;
  onPinDrag?: (pinId: string, coordinates: MapViewport["center"]) => void;
  onPinDragStart?: (pinId: string) => void;
  onMapClick?: (coordinates: MapViewport["center"]) => void;
}

const MapEngineContext = createContext<MapEngineContextValue | null>(null);

interface MapEngineProviderProps {
  children: ReactNode;
  providerId?: MapProviderId;
  basemapView?: MapBasemapView;
  initialPins?: MapEnginePin[];
  initialViewport?: MapViewport;
  selectedPinId?: string | null;
  draggablePinIds?: string[];
  /** Keep map center fixed (zoom only) so overlays stay anchored to the pin. */
  lockCenter?: boolean;
  onViewportChange?: (viewport: MapViewport) => void;
  onPinSelect?: (pinId: string | null) => void;
  onPinDrag?: (pinId: string, coordinates: MapViewport["center"]) => void;
  onPinDragStart?: (pinId: string) => void;
  onMapClick?: (coordinates: MapViewport["center"]) => void;
}

export function MapEngineProvider({
  children,
  providerId = DEFAULT_MAP_PROVIDER_ID,
  basemapView: controlledBasemapView = DEFAULT_MAP_BASEMAP_VIEW,
  initialPins = [],
  initialViewport = DEFAULT_VIEWPORT,
  selectedPinId: controlledSelectedPinId,
  draggablePinIds: controlledDraggablePinIds = [],
  lockCenter = false,
  onViewportChange,
  onPinSelect,
  onPinDrag,
  onPinDragStart,
  onMapClick,
}: MapEngineProviderProps) {
  const [activeProviderId, setActiveProviderId] = useState<MapProviderId>(providerId);
  const [activeBasemapView, setActiveBasemapView] =
    useState<MapBasemapView>(controlledBasemapView);
  const [pins, setPins] = useState<MapEnginePin[]>(initialPins);
  const [internalSelectedPinId, setInternalSelectedPinId] = useState<string | null>(null);
  const [draggablePinIds, setDraggablePinIds] = useState<string[]>(controlledDraggablePinIds);
  const [viewport, setViewportState] = useState<MapViewport>(initialViewport);
  const [isReady, setReady] = useState(false);
  const mapInstanceRef = useRef<MapInstance | null>(null);
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const registerMapInstance = useCallback((instance: MapInstance | null) => {
    mapInstanceRef.current = instance;
  }, []);

  const fitToCoordinates = useCallback(
    (coordinates: MapCoordinates[], padding = 60) => {
      mapInstanceRef.current?.fitToCoordinates(coordinates, padding);
    },
    []
  );

  const setReadyState = useCallback((ready: boolean) => {
    setReady((current) => (current === ready ? current : ready));
  }, []);

  useEffect(() => {
    setActiveProviderId(providerId);
  }, [providerId]);

  useEffect(() => {
    setActiveBasemapView(controlledBasemapView);
  }, [controlledBasemapView]);

  useEffect(() => {
    setPins((current) => {
      if (
        current.length === initialPins.length &&
        current.every(
          (pin, index) =>
            pin.id === initialPins[index]?.id &&
            pin.latitude === initialPins[index]?.latitude &&
            pin.longitude === initialPins[index]?.longitude &&
            pinStyleCacheKey(pin, false) ===
              pinStyleCacheKey(initialPins[index]!, false)
        )
      ) {
        return current;
      }
      return initialPins;
    });
  }, [initialPins]);

  useEffect(() => {
    setDraggablePinIds((current) => {
      if (
        current.length === controlledDraggablePinIds.length &&
        current.every((id, index) => id === controlledDraggablePinIds[index])
      ) {
        return current;
      }
      return controlledDraggablePinIds;
    });
  }, [controlledDraggablePinIds]);

  const selectedPinId = controlledSelectedPinId ?? internalSelectedPinId;

  const setSelectedPinId = useCallback(
    (pinId: string | null) => {
      if (controlledSelectedPinId === undefined) {
        setInternalSelectedPinId(pinId);
      }
      onPinSelect?.(pinId);
    },
    [controlledSelectedPinId, onPinSelect]
  );

  const setViewport = useCallback(
    (nextViewport: MapViewport) => {
      const resolved = lockCenter
        ? {
            ...nextViewport,
            center: viewportRef.current.center,
          }
        : nextViewport;
      setViewportState((current) => {
        if (
          current.center.latitude === resolved.center.latitude &&
          current.center.longitude === resolved.center.longitude &&
          current.zoom === resolved.zoom
        ) {
          return current;
        }
        return resolved;
      });
      onViewportChange?.(resolved);
    },
    [onViewportChange, lockCenter]
  );

  const handlePinDrag = useCallback(
    (pinId: string, coordinates: MapViewport["center"]) => {
      onPinDrag?.(pinId, coordinates);
    },
    [onPinDrag]
  );

  const handlePinDragStart = useCallback(
    (pinId: string) => {
      onPinDragStart?.(pinId);
    },
    [onPinDragStart]
  );

  const handleMapClick = useCallback(
    (coordinates: MapViewport["center"]) => {
      onMapClick?.(coordinates);
    },
    [onMapClick]
  );

  const value = useMemo(
    () => ({
      providerId: activeProviderId,
      basemapView: activeBasemapView,
      pins,
      selectedPinId,
      draggablePinIds,
      viewport,
      isReady,
      lockCenter,
      setProviderId: setActiveProviderId,
      setBasemapView: setActiveBasemapView,
      setPins,
      setSelectedPinId,
      setDraggablePinIds,
      setViewport,
      setReady: setReadyState,
      registerMapInstance,
      fitToCoordinates,
      onPinDrag: handlePinDrag,
      onPinDragStart: handlePinDragStart,
      onMapClick: handleMapClick,
    }),
    [
      activeProviderId,
      activeBasemapView,
      pins,
      selectedPinId,
      draggablePinIds,
      viewport,
      isReady,
      lockCenter,
      setSelectedPinId,
      setViewport,
      setReadyState,
      registerMapInstance,
      fitToCoordinates,
      handlePinDrag,
      handlePinDragStart,
      handleMapClick,
    ]
  );

  return <MapEngineContext.Provider value={value}>{children}</MapEngineContext.Provider>;
}

export function useMapEngine(): MapEngineContextValue {
  const context = useContext(MapEngineContext);
  if (!context) {
    throw new Error("useMapEngine must be used within MapEngineProvider");
  }
  return context;
}
