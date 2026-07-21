import { DEFAULT_MAP_BASEMAP_VIEW } from "../basemap";
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
import { resolveLeafletBasemapLayer } from "./basemap-layers";

type ListenerMap = Map<MapEngineEvent, Set<MapEngineEventHandler>>;
type LeafletContainer = HTMLElement & { _leaflet_id?: number };
type LeafletMarker = import("leaflet").Marker;
type LeafletMap = import("leaflet").Map;
type LeafletTileLayer = import("leaflet").TileLayer;
type LeafletNamespace = typeof import("leaflet");

function releaseLeafletContainer(container: HTMLElement): void {
  const element = container as LeafletContainer;
  if (element._leaflet_id == null) {
    return;
  }

  element.replaceChildren();
  delete element._leaflet_id;
}

function createMarkerIcon(
  L: LeafletNamespace,
  pin: MapEnginePin,
  highlighted: boolean
) {
  const marker = buildPinMarkerHtml(pin, highlighted);

  return L.divIcon({
    html: marker.html,
    className: marker.className,
    iconSize: marker.iconSize,
    iconAnchor: marker.iconAnchor,
  });
}

function markerIconKey(pin: MapEnginePin, highlighted: boolean): string {
  return pinStyleCacheKey(pin, highlighted);
}

function coordinatesMatch(
  left: { latitude: number; longitude: number },
  right: { latitude: number; longitude: number }
): boolean {
  return left.latitude === right.latitude && left.longitude === right.longitude;
}

export class LeafletOpenStreetMapProvider implements MapProvider {
  readonly id = "leaflet-osm" as const;
  readonly label = "OpenStreetMap (Leaflet)";
  readonly description =
    "Open-source street tiles with optional satellite basemap layers. Default TalisMaps™ engine — no API key required for street view.";
  readonly supportedBasemapViews: MapBasemapView[] = ["street", "satellite"];

  isAvailable(): boolean {
    return typeof window !== "undefined";
  }

  async mount(container: HTMLElement, options: MapMountOptions) {
    const L = (await import("leaflet")).default;
    await import("leaflet/dist/leaflet.css");

    const listeners: ListenerMap = new Map();
    const markers = new Map<string, LeafletMarker>();
    const markerIconKeys = new Map<string, string>();
    const markerDraggable = new Map<string, boolean>();
    let pins: MapEnginePin[] = options.pins ?? [];
    let selectedPinId = options.selectedPinId ?? null;
    let draggablePinIds = new Set(options.draggablePinIds ?? []);
    let basemapView: MapBasemapView =
      options.basemapView && this.supportedBasemapViews.includes(options.basemapView)
        ? options.basemapView
        : DEFAULT_MAP_BASEMAP_VIEW;
    let baseLayer: LeafletTileLayer | null = null;
    let draggingPinId: string | null = null;
    let pendingSync = false;
    let mapInteracting = false;
    let disposed = false;

    releaseLeafletContainer(container);
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.minHeight = "inherit";
    container.style.touchAction = "none";

    L.DomEvent.disableScrollPropagation(container);
    L.DomEvent.disableClickPropagation(container);

    const map: LeafletMap = L.map(container, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
    }).setView([options.center.latitude, options.center.longitude], options.zoom);

    const mapContainer = map.getContainer();
    mapContainer.style.touchAction = "none";
    L.DomEvent.disableScrollPropagation(mapContainer);
    L.DomEvent.disableClickPropagation(mapContainer);

    const applyBasemapView = (view: MapBasemapView) => {
      const resolved =
        this.supportedBasemapViews.includes(view) ? view : DEFAULT_MAP_BASEMAP_VIEW;
      const layer = resolveLeafletBasemapLayer(resolved);
      if (baseLayer) {
        map.removeLayer(baseLayer);
      }
      baseLayer = L.tileLayer(layer.urlTemplate, {
        attribution: layer.attribution,
        maxZoom: layer.maxZoom,
        ...(layer.subdomains ? { subdomains: layer.subdomains } : {}),
      }).addTo(map);
      basemapView = resolved;
    };

    applyBasemapView(basemapView);

    map.attributionControl.setPrefix(false);

    const emit = (event: MapEngineEvent, payload?: Parameters<MapEngineEventHandler>[0]) => {
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
      marker.off();
      marker.remove();
      markers.delete(pinId);
      markerIconKeys.delete(pinId);
      markerDraggable.delete(pinId);
    };

    const attachMarker = (pin: MapEnginePin) => {
      const highlighted = selectedPinId === pin.id;
      const shouldDrag = draggablePinIds.has(pin.id);
      const iconKey = markerIconKey(pin, highlighted);

      const marker = L.marker([pin.latitude, pin.longitude], {
        icon: createMarkerIcon(L, pin, highlighted),
        draggable: shouldDrag,
        autoPan: shouldDrag,
        interactive: true,
      }).addTo(map);

      marker.on("click", (event) => {
        L.DomEvent.stopPropagation(event);
        emit("pinclick", { pinId: pin.id });
      });

      marker.on("dragstart", () => {
        draggingPinId = pin.id;
        map.dragging.disable();
        emit("pindragstart", { pinId: pin.id });
      });

      marker.on("dragend", () => {
        const position = marker.getLatLng();
        pin.latitude = position.lat;
        pin.longitude = position.lng;
        draggingPinId = null;
        map.dragging.enable();
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
    };

    const syncMarkers = () => {
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
        const nextIconKey = markerIconKey(pin, highlighted);
        const existing = markers.get(pin.id);

        if (existing) {
          const current = existing.getLatLng();
          if (current.lat !== pin.latitude || current.lng !== pin.longitude) {
            existing.setLatLng([pin.latitude, pin.longitude]);
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

    map.on("moveend zoomend", () => {
      emit("viewportchange", { viewport: getViewport() });
    });

    map.on("dragstart zoomstart", () => {
      mapInteracting = true;
    });

    map.on("dragend zoomend", () => {
      mapInteracting = false;
      if (pendingSync) {
        pendingSync = false;
        syncMarkers();
      }
    });

    map.on("click", (event: { latlng: { lat: number; lng: number } }) => {
      emit("mapclick", {
        coordinates: {
          latitude: event.latlng.lat,
          longitude: event.latlng.lng,
        },
      });
    });

    const instance = {
      destroy() {
        disposed = true;
        draggingPinId = null;
        pendingSync = false;
        for (const pinId of [...markers.keys()]) {
          removeMarker(pinId);
        }
        map.off();
        map.remove();
        releaseLeafletContainer(container);
        listeners.clear();
      },
      setViewport(viewport: Partial<MapViewport>) {
        if (viewport.center && viewport.zoom !== undefined) {
          map.setView(
            [viewport.center.latitude, viewport.center.longitude],
            viewport.zoom,
            { animate: true }
          );
          return;
        }
        if (viewport.center) {
          map.panTo([viewport.center.latitude, viewport.center.longitude], { animate: true });
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
          if (pins.length === 1 && !mapInteracting && !draggingPinId) {
            const [pin] = pins;
            map.setView([pin.latitude, pin.longitude], Math.max(map.getZoom(), 15), {
              animate: false,
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

        if (pinId) {
          const pin = pins.find((item) => item.id === pinId);
          if (pin) {
            map.setView([pin.latitude, pin.longitude], Math.max(map.getZoom(), 14), {
              animate: true,
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
        if (view === basemapView) return;
        applyBasemapView(view);
      },
      getBasemapView() {
        return basemapView;
      },
      fitToPins(padding = 60) {
        if (pins.length === 0) return;
        const bounds = L.latLngBounds(
          pins.map((pin) => [pin.latitude, pin.longitude] as [number, number])
        );
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [padding, padding], maxZoom: 14 });
        }
      },
      fitToCoordinates(coordinates: MapCoordinates[], padding = 60) {
        if (coordinates.length === 0) return;
        const bounds = L.latLngBounds(
          coordinates.map(
            (coordinate: MapCoordinates) =>
              [coordinate.latitude, coordinate.longitude] as [number, number]
          )
        );
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [padding, padding], maxZoom: 14 });
        }
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

    syncMarkers();
    if (pins.length > 0 && !selectedPinId) {
      instance.fitToPins();
    }

    map.whenReady(() => {
      requestAnimationFrame(() => {
        if (disposed || !container.isConnected) {
          return;
        }
        try {
          map.invalidateSize();
        } catch {
          // Map may already be removed during fast remounts.
        }
      });
    });

    emit("viewportchange", { viewport: getViewport() });

    return instance;
  }
}
