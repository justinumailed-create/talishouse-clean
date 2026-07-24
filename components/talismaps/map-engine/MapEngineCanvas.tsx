"use client";

import { useEffect, useRef } from "react";
import {
  createMapProvider,
  type MapEngineEventHandler,
  type MapInstance,
  type MapMapClickEvent,
  type MapPinClickEvent,
  type MapPinDragEvent,
  type MapPinDragStartEvent,
  type MapViewportChangeEvent,
} from "@/lib/talismaps/map-engine";
import { useMapEngine } from "./MapEngineProvider";

interface MapEngineCanvasProps {
  className?: string;
}

export default function MapEngineCanvas({ className = "h-full w-full" }: MapEngineCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<MapInstance | null>(null);
  const mountGenerationRef = useRef(0);
  const readyRef = useRef(false);
  const {
    providerId,
    basemapView,
    pins,
    selectedPinId,
    draggablePinIds,
    viewport,
    setViewport,
    setSelectedPinId,
    setReady,
    onPinDrag,
    onPinDragStart,
    onMapClick,
    onMapDragStart,
    onMapZoom,
    registerMapInstance,
    lockCenter,
    lockCenterOffset,
  } = useMapEngine();

  const setViewportRef = useRef(setViewport);
  const setSelectedPinIdRef = useRef(setSelectedPinId);
  const onPinDragRef = useRef(onPinDrag);
  const onPinDragStartRef = useRef(onPinDragStart);
  const onMapClickRef = useRef(onMapClick);
  const onMapDragStartRef = useRef(onMapDragStart);
  const onMapZoomRef = useRef(onMapZoom);
  const registerMapInstanceRef = useRef(registerMapInstance);
  const setReadyRef = useRef(setReady);
  const viewportRef = useRef(viewport);
  const pinsRef = useRef(pins);
  const selectedPinIdRef = useRef(selectedPinId);
  const draggablePinIdsRef = useRef(draggablePinIds);
  const basemapViewRef = useRef(basemapView);
  const lockCenterRef = useRef(lockCenter);
  const lockCenterOffsetRef = useRef(lockCenterOffset);

  useEffect(() => {
    setViewportRef.current = setViewport;
    setSelectedPinIdRef.current = setSelectedPinId;
    onPinDragRef.current = onPinDrag;
    onPinDragStartRef.current = onPinDragStart;
    onMapClickRef.current = onMapClick;
    onMapDragStartRef.current = onMapDragStart;
    onMapZoomRef.current = onMapZoom;
    registerMapInstanceRef.current = registerMapInstance;
    setReadyRef.current = setReady;
    viewportRef.current = viewport;
    pinsRef.current = pins;
    selectedPinIdRef.current = selectedPinId;
    draggablePinIdsRef.current = draggablePinIds;
    basemapViewRef.current = basemapView;
    lockCenterRef.current = lockCenter;
    lockCenterOffsetRef.current = lockCenterOffset;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const generation = ++mountGenerationRef.current;
    const abortController = new AbortController();
    const provider = createMapProvider(providerId);

    const handleViewportChange: MapEngineEventHandler = (payload) => {
      const event = payload as MapViewportChangeEvent | undefined;
      if (event?.viewport) {
        setViewportRef.current(event.viewport);
      }
    };

    const handlePinClick: MapEngineEventHandler = (payload) => {
      const event = payload as MapPinClickEvent | undefined;
      if (event?.pinId) {
        setSelectedPinIdRef.current(event.pinId);
      }
    };

    const handleMapClick: MapEngineEventHandler = (payload) => {
      setSelectedPinIdRef.current(null);
      const event = payload as MapMapClickEvent | undefined;
      if (event?.coordinates) {
        onMapClickRef.current?.(event.coordinates);
      }
    };

    const handlePinDrag: MapEngineEventHandler = (payload) => {
      const event = payload as MapPinDragEvent | undefined;
      if (event?.pinId && event.coordinates) {
        onPinDragRef.current?.(event.pinId, event.coordinates);
      }
    };

    const handlePinDragStart: MapEngineEventHandler = (payload) => {
      const event = payload as MapPinDragStartEvent | undefined;
      if (event?.pinId) {
        onPinDragStartRef.current?.(event.pinId);
      }
    };

    const handleMapDragStart: MapEngineEventHandler = () => {
      onMapDragStartRef.current?.();
    };

    const handleMapZoom: MapEngineEventHandler = () => {
      onMapZoomRef.current?.();
    };

    void provider
      .mount(container, {
        center: viewportRef.current.center,
        zoom: viewportRef.current.zoom,
        pins: pinsRef.current,
        selectedPinId: selectedPinIdRef.current,
        draggablePinIds: draggablePinIdsRef.current,
        basemapView: basemapViewRef.current,
        lockCenter: lockCenterRef.current,
        lockCenterOffset: lockCenterOffsetRef.current,
        signal: abortController.signal,
      })
      .then((instance) => {
        if (
          abortController.signal.aborted ||
          generation !== mountGenerationRef.current
        ) {
          instance.destroy();
          return;
        }

        instanceRef.current = instance;
        registerMapInstanceRef.current(instance);
        instance.on("viewportchange", handleViewportChange);
        instance.on("pinclick", handlePinClick);
        instance.on("mapclick", handleMapClick);
        instance.on("pindrag", handlePinDrag);
        instance.on("pindragstart", handlePinDragStart);
        instance.on("mapdragstart", handleMapDragStart);
        instance.on("mapzoom", handleMapZoom);

        if (!readyRef.current) {
          readyRef.current = true;
          setReadyRef.current(true);
        }
      })
      .catch((error) => {
        if (
          abortController.signal.aborted ||
          generation !== mountGenerationRef.current
        ) {
          return;
        }
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }
        console.error("[MapEngineCanvas] failed to mount provider:", error);
        if (readyRef.current) {
          readyRef.current = false;
          setReadyRef.current(false);
        }
      });

    return () => {
      abortController.abort();
      registerMapInstanceRef.current(null);
      instanceRef.current?.destroy();
      instanceRef.current = null;
      if (readyRef.current) {
        readyRef.current = false;
        setReadyRef.current(false);
      }
    };
  }, [providerId, lockCenter]);

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;
    instance.setDraggablePinIds(draggablePinIds);
    instance.setPins(pins);
  }, [pins, draggablePinIds]);

  // Apply programmatic viewport changes (e.g. claim-form address geocode → pan map).
  // Skip when center is locked (MapSite pin under tip) — that path owns the camera.
  // Skip when the instance already matches to avoid fighting user pan/zoom echoes.
  useEffect(() => {
    if (lockCenter) return;
    const instance = instanceRef.current;
    if (!instance) return;
    const current = instance.getViewport();
    const sameCenter =
      Math.abs(current.center.latitude - viewport.center.latitude) < 1e-7 &&
      Math.abs(current.center.longitude - viewport.center.longitude) < 1e-7;
    if (sameCenter && current.zoom === viewport.zoom) return;
    instance.setViewport(viewport);
  }, [viewport, lockCenter]);

  useEffect(() => {
    instanceRef.current?.setSelectedPinId(selectedPinId);
  }, [selectedPinId]);

  useEffect(() => {
    instanceRef.current?.setBasemapView?.(basemapView);
  }, [basemapView]);

  useEffect(() => {
    instanceRef.current?.setLockCenterOffset?.(lockCenterOffset);
  }, [lockCenterOffset]);

  return (
    <div
      ref={containerRef}
      className={`relative isolate touch-none ${className}`}
      style={{ width: "100%", height: "100%", minHeight: "inherit" }}
    />
  );
}
