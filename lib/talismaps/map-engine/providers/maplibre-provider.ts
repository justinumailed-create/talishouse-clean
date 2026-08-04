import {
  DEFAULT_MAP_STYLE_ID,
  getMapStyleManager,
  isMapStyleId,
  type MapStyleId,
} from "../styles";
import type {
  MapBasemapView,
  MapCoordinates,
  MapEngineEvent,
  MapEngineEventHandler,
  MapEnginePin,
  MapMountOptions,
  MapProvider,
  MapViewport,
} from "../types";
import { buildPinMarkerHtml, pinStyleCacheKey } from "../pin-marker-icon";

type ListenerMap = Map<MapEngineEvent, Set<MapEngineEventHandler>>;
type MapLibreMap = import("maplibre-gl").Map;
type MapLibreMarker = import("maplibre-gl").Marker;

function coordinatesMatch(
  left: { latitude: number; longitude: number },
  right: { latitude: number; longitude: number }
): boolean {
  return left.latitude === right.latitude && left.longitude === right.longitude;
}

function resolveStyleId(
  preferred: MapBasemapView | undefined,
  supported: MapStyleId[]
): MapStyleId {
  if (preferred && isMapStyleId(preferred) && supported.includes(preferred)) {
    return preferred;
  }
  if (supported.includes(DEFAULT_MAP_STYLE_ID)) {
    return DEFAULT_MAP_STYLE_ID;
  }
  return supported[0] ?? DEFAULT_MAP_STYLE_ID;
}

/**
 * Keep satellite raster crisp: disable fade and prefer linear resampling.
 * Also raise MapLibre maxZoom to the best raster source maxzoom so users can
 * reach MapTiler satellite-v2 detail (up to ~z20) instead of stopping early.
 */
function sharpenRasterImagery(map: MapLibreMap): void {
  try {
    const style = map.getStyle();
    if (!style?.sources) return;

    let sourceMaxZoom = 0;
    for (const source of Object.values(style.sources)) {
      if (
        source &&
        typeof source === "object" &&
        "type" in source &&
        source.type === "raster" &&
        "maxzoom" in source &&
        typeof source.maxzoom === "number"
      ) {
        sourceMaxZoom = Math.max(sourceMaxZoom, source.maxzoom);
      }
    }

    if (sourceMaxZoom > 0) {
      map.setMaxZoom(Math.min(Math.max(sourceMaxZoom, 18), 22));
    }

    for (const layer of style.layers ?? []) {
      if (layer.type !== "raster") continue;
      try {
        map.setPaintProperty(layer.id, "raster-fade-duration", 0);
        map.setPaintProperty(layer.id, "raster-resampling", "linear");
      } catch {
        // Layer may not expose every paint property in every style.
      }
    }
  } catch {
    // Style may still be swapping; ignore.
  }
}

/** Hide place / business / transit layers so only TalisMaps™ pins brand the map. */
function hideThirdPartyPoiLayers(map: MapLibreMap): void {
  try {
    const style = map.getStyle();
    for (const layer of style?.layers ?? []) {
      const id = layer.id.toLowerCase();
      if (
        id.includes("poi") ||
        id.includes("transit") ||
        id.includes("housenumber")
      ) {
        try {
          map.setLayoutProperty(layer.id, "visibility", "none");
        } catch {
          // Layer may not support layout visibility.
        }
      }
    }
  } catch {
    // Style may still be swapping; ignore.
  }
}

function applyBasemapPresentation(map: MapLibreMap): void {
  sharpenRasterImagery(map);
  hideThirdPartyPoiLayers(map);
}

const CONTAINER_OWNER_KEY = "__talismapsMapOwner" as const;

function waitForMapLoad(
  map: MapLibreMap,
  isCancelled: () => boolean
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isCancelled()) {
      reject(new DOMException("MapLibre mount aborted", "AbortError"));
      return;
    }
    if (map.loaded()) {
      resolve();
      return;
    }
    const onLoad = () => {
      window.clearTimeout(timeoutId);
      resolve();
    };
    const timeoutId = window.setTimeout(() => {
      map.off("load", onLoad);
      // Proceed even if "load" never fired — style may still be recovering.
      resolve();
    }, 10_000);
    map.once("load", onLoad);
  });
}

function waitForStyleIdle(
  map: MapLibreMap,
  isCancelled: () => boolean
): Promise<void> {
  return new Promise((resolve) => {
    if (isCancelled() || map.isStyleLoaded()) {
      resolve();
      return;
    }
    const onIdle = () => {
      if (map.isStyleLoaded() || isCancelled()) {
        map.off("idle", onIdle);
        window.clearTimeout(timeoutId);
        resolve();
      }
    };
    map.on("idle", onIdle);
    const timeoutId = window.setTimeout(() => {
      map.off("idle", onIdle);
      resolve();
    }, 8_000);
  });
}

/**
 * MapLibre GL JS adapter for TalisMaps™.
 * Styles come from MapStyleManager — never hard-coded vendor URLs here.
 */
export class MapLibreProvider implements MapProvider {
  readonly id = "maplibre" as const;
  readonly label = "MapLibre GL JS";
  readonly description =
    "Open-source vector rendering engine with interchangeable tile styles (MapTiler Satellite by default).";
  readonly supportedBasemapViews: MapBasemapView[] = [
    "satellite",
    "street",
    "terrain",
    "light",
    "dark",
  ];

  isAvailable(): boolean {
    return typeof window !== "undefined";
  }

  async mount(container: HTMLElement, options: MapMountOptions) {
    const signal = options.signal;
    if (signal?.aborted) {
      throw new DOMException("MapLibre mount aborted", "AbortError");
    }

    const maplibregl = await import("maplibre-gl");
    await import("maplibre-gl/dist/maplibre-gl.css");

    if (signal?.aborted) {
      throw new DOMException("MapLibre mount aborted", "AbortError");
    }

    const styleManager = getMapStyleManager();
    const supportedStyles = [...this.supportedBasemapViews];
    const listeners: ListenerMap = new Map();
    const markers = new Map<string, MapLibreMarker>();
    const markerIconKeys = new Map<string, string>();
    const markerDraggable = new Map<string, boolean>();
    const markerElements = new Map<string, HTMLDivElement>();
    const mountOwner = Symbol("talismaps-maplibre-mount");

    let pins: MapEnginePin[] = options.pins ?? [];
    let selectedPinId = options.selectedPinId ?? null;
    let draggablePinIds = new Set(options.draggablePinIds ?? []);
    let styleId = resolveStyleId(options.basemapView, supportedStyles);
    let activeStyleUrl = "";
    let draggingPinId: string | null = null;
    let pendingSync = false;
    let mapInteracting = false;
    let disposed = false;
    let styleReady = false;
    let map!: MapLibreMap;

    const isCancelled = () => disposed || Boolean(signal?.aborted);

    const claimContainer = () => {
      (
        container as HTMLElement & {
          [CONTAINER_OWNER_KEY]?: symbol;
        }
      )[CONTAINER_OWNER_KEY] = mountOwner;
    };

    const ownsContainer = () =>
      (
        container as HTMLElement & {
          [CONTAINER_OWNER_KEY]?: symbol;
        }
      )[CONTAINER_OWNER_KEY] === mountOwner;

    container.style.width = "100%";
    container.style.height = "100%";
    container.style.minHeight = "inherit";
    container.style.touchAction = "none";
    claimContainer();

    const host = document.createElement("div");
    host.style.width = "100%";
    host.style.height = "100%";
    host.style.minHeight = "inherit";
    host.style.position = "relative";
    container.replaceChildren(host);

    const initial = styleManager.resolve(styleId);
    activeStyleUrl = initial.styleUrl;
    if (initial.usingPlaceholderKey && process.env.NODE_ENV !== "production") {
      console.warn(
        "[TalisMaps] Using placeholder MapTiler API key. Set NEXT_PUBLIC_MAPTILER_API_KEY."
      );
    }

    const pixelRatio =
      typeof window !== "undefined"
        ? Math.min(Math.max(window.devicePixelRatio || 1, 1), 2)
        : 1;

    map = new maplibregl.Map({
      container: host,
      style: activeStyleUrl,
      center: [options.center.longitude, options.center.latitude],
      zoom: options.zoom,
      minZoom: 1,
      // MapTiler satellite-v2 supports up to z22; keep headroom without mushy overzoom.
      maxZoom: 20,
      pixelRatio,
      attributionControl: false,
      fadeDuration: 0,
      // Avoid rendering half-initialized paint/layout props (constantOr crashes).
      failIfMajorPerformanceCaveat: false,
    });
    claimContainer();

    const onAbort = () => {
      disposed = true;
      styleReady = false;
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    const emit = (
      event: MapEngineEvent,
      payload?: Parameters<MapEngineEventHandler>[0]
    ) => {
      listeners.get(event)?.forEach((handler) => handler(payload));
    };

    const getViewport = (): MapViewport => {
      const center = map.getCenter();
      return {
        center: { latitude: center.lat, longitude: center.lng },
        zoom: map.getZoom(),
      };
    };

    const removeMarker = (pinId: string) => {
      const marker = markers.get(pinId);
      if (!marker) return;
      marker.remove();
      markers.delete(pinId);
      markerIconKeys.delete(pinId);
      markerDraggable.delete(pinId);
      markerElements.delete(pinId);
    };

    const attachMarker = (pin: MapEnginePin) => {
      if (!styleReady || disposed) return;

      const highlighted = selectedPinId === pin.id;
      const shouldDrag = draggablePinIds.has(pin.id);
      const iconKey = pinStyleCacheKey(pin, highlighted);
      const markerHtml = buildPinMarkerHtml(pin, highlighted);

      const el = document.createElement("div");
      el.className = markerHtml.className || "talismaps-pin-marker";
      el.style.width = `${markerHtml.iconSize[0]}px`;
      el.style.height = `${markerHtml.iconSize[1]}px`;
      el.style.cursor = shouldDrag ? "grab" : "pointer";
      el.innerHTML = markerHtml.html;

      const marker = new maplibregl.Marker({
        element: el,
        draggable: shouldDrag,
        anchor: "center",
        offset: [
          markerHtml.iconSize[0] / 2 - markerHtml.iconAnchor[0],
          markerHtml.iconSize[1] / 2 - markerHtml.iconAnchor[1],
        ],
      })
        .setLngLat([pin.longitude, pin.latitude])
        .addTo(map);

      el.addEventListener("click", (event) => {
        event.stopPropagation();
        emit("pinclick", { pinId: pin.id });
      });

      marker.on("dragstart", () => {
        draggingPinId = pin.id;
        map.dragPan.disable();
        emit("pindragstart", { pinId: pin.id });
      });

      marker.on("dragend", () => {
        const position = marker.getLngLat();
        pin.latitude = position.lat;
        pin.longitude = position.lng;
        draggingPinId = null;
        map.dragPan.enable();
        emit("pindrag", {
          pinId: pin.id,
          coordinates: { latitude: position.lat, longitude: position.lng },
        });
        if (pendingSync) {
          pendingSync = false;
          syncMarkers();
        }
      });

      markers.set(pin.id, marker);
      markerIconKeys.set(pin.id, iconKey);
      markerDraggable.set(pin.id, shouldDrag);
      markerElements.set(pin.id, el);
    };

    const syncMarkers = () => {
      if (!styleReady) {
        pendingSync = true;
        return;
      }
      if (draggingPinId || mapInteracting) {
        pendingSync = true;
        return;
      }
      if (disposed || !container.isConnected) {
        return;
      }

      const nextPinIds = new Set(pins.map((pin) => pin.id));

      for (const pinId of [...markers.keys()]) {
        if (!nextPinIds.has(pinId)) {
          removeMarker(pinId);
        }
      }

      for (const pin of pins) {
        const highlighted = selectedPinId === pin.id;
        const shouldDrag = draggablePinIds.has(pin.id);
        const nextIconKey = pinStyleCacheKey(pin, highlighted);
        const existing = markers.get(pin.id);

        if (existing) {
          const current = existing.getLngLat();
          if (current.lat !== pin.latitude || current.lng !== pin.longitude) {
            existing.setLngLat([pin.longitude, pin.latitude]);
          }

          const iconChanged = markerIconKeys.get(pin.id) !== nextIconKey;
          const dragChanged = markerDraggable.get(pin.id) !== shouldDrag;

          if (iconChanged || dragChanged) {
            removeMarker(pin.id);
            attachMarker(pin);
          }
          continue;
        }

        attachMarker(pin);
      }
    };

    const applyStyleUrl = (url: string) => {
      if (disposed) return;
      if (url === activeStyleUrl) return;
      styleReady = false;
      activeStyleUrl = url;
      try {
        map.setStyle(url, { diff: false });
      } catch (error) {
        console.error("[TalisMaps] setStyle failed", error);
      }
    };

    const applyStyle = (nextStyleId: MapStyleId) => {
      const resolvedStyle = styleManager.resolve(nextStyleId);
      styleId = nextStyleId;
      applyStyleUrl(resolvedStyle.styleUrl);
    };

    map.on("error", (event) => {
      const error = event.error as
        | { status?: number; message?: string; name?: string }
        | undefined;
      const message = error?.message ?? String(event.error ?? "");
      if (process.env.NODE_ENV !== "production") {
        console.warn("[TalisMaps] MapLibre / MapTiler error", message);
      }
    });

    map.on("load", () => {
      styleReady = true;
      applyBasemapPresentation(map);
      if (pendingSync) {
        pendingSync = false;
        syncMarkers();
      }
    });

    map.on("style.load", () => {
      styleReady = true;
      applyBasemapPresentation(map);
      if (pendingSync) {
        pendingSync = false;
        syncMarkers();
      }
    });

    map.on("moveend", () => {
      emit("viewportchange", { viewport: getViewport() });
    });
    map.on("zoomend", () => {
      emit("viewportchange", { viewport: getViewport() });
    });
    map.on("dragstart", () => {
      mapInteracting = true;
    });
    map.on("zoomstart", () => {
      mapInteracting = true;
    });
    map.on("dragend", () => {
      mapInteracting = false;
      if (pendingSync) {
        pendingSync = false;
        syncMarkers();
      }
    });
    map.on("zoomend", () => {
      mapInteracting = false;
      if (pendingSync) {
        pendingSync = false;
        syncMarkers();
      }
    });
    map.on("click", (event) => {
      emit("mapclick", {
        coordinates: {
          latitude: event.lngLat.lat,
          longitude: event.lngLat.lng,
        },
      });
    });

    const instance = {
      destroy() {
        disposed = true;
        styleReady = false;
        draggingPinId = null;
        pendingSync = false;
        signal?.removeEventListener("abort", onAbort);
        for (const pinId of [...markers.keys()]) {
          removeMarker(pinId);
        }
        try {
          // Host is mount-private, so remove() cannot clobber a newer map.
          map.remove();
        } catch {
          // Map may already be removed.
        }
        if (ownsContainer()) {
          container.replaceChildren();
          delete (
            container as HTMLElement & {
              [CONTAINER_OWNER_KEY]?: symbol;
            }
          )[CONTAINER_OWNER_KEY];
        }
        listeners.clear();
      },
      setViewport(viewport: Partial<MapViewport>) {
        if (viewport.center && viewport.zoom !== undefined) {
          map.easeTo({
            center: [viewport.center.longitude, viewport.center.latitude],
            zoom: viewport.zoom,
          });
          return;
        }
        if (viewport.center) {
          map.panTo([viewport.center.longitude, viewport.center.latitude]);
        }
        if (viewport.zoom !== undefined) {
          map.setZoom(viewport.zoom);
        }
      },
      getViewport,
      setPins(nextPins: MapEnginePin[]) {
        const unchanged =
          pins.length === nextPins.length &&
          pins.every(
            (pin, index) =>
              pin.id === nextPins[index]?.id &&
              coordinatesMatch(pin, nextPins[index]) &&
              pinStyleCacheKey(pin, false) ===
                pinStyleCacheKey(nextPins[index]!, false)
          );

        pins = nextPins;
        if (!unchanged) {
          syncMarkers();
          if (pins.length === 1 && !mapInteracting && !draggingPinId && styleReady) {
            const [pin] = pins;
            map.jumpTo({
              center: [pin.longitude, pin.latitude],
              zoom: Math.max(map.getZoom(), 16),
            });
          }
        }
      },
      setSelectedPinId(pinId: string | null) {
        if (selectedPinId === pinId) {
          return;
        }

        selectedPinId = pinId;
        syncMarkers();

        if (pinId && styleReady) {
          const pin = pins.find((item) => item.id === pinId);
          if (pin) {
            map.easeTo({
              center: [pin.longitude, pin.latitude],
              zoom: Math.max(map.getZoom(), 16),
            });
          }
        }
      },
      setDraggablePinIds(pinIds: string[]) {
        const next = new Set(pinIds);
        const unchanged =
          next.size === draggablePinIds.size &&
          [...next].every((id) => draggablePinIds.has(id));

        draggablePinIds = next;
        if (!unchanged) {
          syncMarkers();
        }
      },
      setBasemapView(view: MapBasemapView) {
        if (!isMapStyleId(view) || !supportedStyles.includes(view)) {
          return;
        }
        if (view === styleId) return;
        applyStyle(view);
      },
      getBasemapView() {
        return styleId;
      },
      fitToPins(padding = 60) {
        instance.fitToCoordinates(
          pins.map((pin) => ({
            latitude: pin.latitude,
            longitude: pin.longitude,
          })),
          padding
        );
      },
      fitToCoordinates(coordinates: MapCoordinates[], padding = 60) {
        if (!styleReady || coordinates.length === 0) return;
        if (coordinates.length === 1) {
          map.easeTo({
            center: [coordinates[0].longitude, coordinates[0].latitude],
            zoom: Math.max(map.getZoom(), 16),
          });
          return;
        }

        const bounds = coordinates.reduce(
          (acc, coordinate) =>
            acc.extend([coordinate.longitude, coordinate.latitude]),
          new maplibregl.LngLatBounds(
            [coordinates[0].longitude, coordinates[0].latitude],
            [coordinates[0].longitude, coordinates[0].latitude]
          )
        );

        map.fitBounds(bounds, {
          padding,
          maxZoom: 18,
        });
      },
      on(event: MapEngineEvent, handler: MapEngineEventHandler) {
        if (!listeners.has(event)) {
          listeners.set(event, new Set());
        }
        listeners.get(event)!.add(handler);
      },
      off(event: MapEngineEvent, handler: MapEngineEventHandler) {
        listeners.get(event)?.delete(handler);
      },
    };

    await waitForMapLoad(map, isCancelled);
    if (isCancelled()) {
      instance.destroy();
      throw new DOMException("MapLibre mount aborted", "AbortError");
    }

    await waitForStyleIdle(map, isCancelled);
    if (isCancelled() || !ownsContainer()) {
      instance.destroy();
      throw new DOMException("MapLibre mount aborted", "AbortError");
    }

    styleReady = true;
    syncMarkers();
    if (pins.length > 0 && !selectedPinId) {
      instance.fitToPins();
    }

    requestAnimationFrame(() => {
      if (disposed || !ownsContainer() || !container.isConnected) return;
      try {
        map.resize();
      } catch {
        // Ignore resize after teardown.
      }
    });

    emit("viewportchange", { viewport: getViewport() });

    return instance;
  }
}
