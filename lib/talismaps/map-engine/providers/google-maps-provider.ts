import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { buildPinMarkerHtml, pinStyleCacheKey } from "../pin-marker-icon";
import type {
  MapBasemapView,
  MapCoordinates,
  MapEngineEvent,
  MapEngineEventHandler,
  MapEnginePin,
  MapInstance,
  MapMountOptions,
  MapProvider,
  MapViewport,
} from "../types";

type ListenerMap = Map<MapEngineEvent, Set<MapEngineEventHandler>>;

const CONTAINER_OWNER_KEY = "__talismapsMapOwner" as const;

export function getGoogleMapsApiKey(): string {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_TALISMAPS_GOOGLE_MAPS_API_KEY?.trim() ||
    ""
  );
}

function basemapToMapTypeId(view: MapBasemapView): string {
  switch (view) {
    case "satellite":
      return "hybrid";
    case "terrain":
      return "terrain";
    case "street":
    case "light":
    case "dark":
    default:
      return "roadmap";
  }
}

function resolveBasemapView(
  preferred: MapBasemapView | undefined,
  supported: MapBasemapView[]
): MapBasemapView {
  if (preferred && supported.includes(preferred)) return preferred;
  if (supported.includes("satellite")) return "satellite";
  return supported[0] ?? "satellite";
}

type PinOverlay = {
  setMap: (map: google.maps.Map | null) => void;
  setPosition: (position: google.maps.LatLng) => void;
  setContent: (
    html: string,
    className: string,
    width: number,
    height: number,
    anchorX: number,
    anchorY: number
  ) => void;
  setDraggable: (draggable: boolean) => void;
  setHandlers: (handlers: {
    onClick?: () => void;
    onDragStart?: () => void;
    onDragEnd?: (latLng: google.maps.LatLng) => void;
  }) => void;
};

/**
 * Create an HTML overlay marker after the Maps JS API is loaded.
 * Preserves TalisMaps™ pin styling without requiring a Cloud Map ID.
 */
function createHtmlPinOverlayClass() {
  return class HtmlPinOverlay extends google.maps.OverlayView {
    private position: google.maps.LatLng;
    private container: HTMLDivElement;
    private dragEnabled: boolean;
    private onClick: (() => void) | null = null;
    private onDragStart: (() => void) | null = null;
    private onDragEnd: ((latLng: google.maps.LatLng) => void) | null = null;
    private dragging = false;

    constructor(options: {
      position: google.maps.LatLng;
      html: string;
      className: string;
      width: number;
      height: number;
      anchorX: number;
      anchorY: number;
      draggable?: boolean;
    }) {
      super();
      this.position = options.position;
      this.dragEnabled = Boolean(options.draggable);

      this.container = document.createElement("div");
      this.container.className = options.className;
      this.container.style.position = "absolute";
      this.container.style.width = `${options.width}px`;
      this.container.style.height = `${options.height}px`;
      this.container.style.transform = `translate(${-options.anchorX}px, ${-options.anchorY}px)`;
      this.container.style.cursor = this.dragEnabled ? "grab" : "pointer";
      this.container.style.pointerEvents = "auto";
      // Keep pins above map imagery within Google overlay panes.
      this.container.style.zIndex = "500";
      this.container.innerHTML = options.html;
    }

    setHandlers(handlers: {
      onClick?: () => void;
      onDragStart?: () => void;
      onDragEnd?: (latLng: google.maps.LatLng) => void;
    }) {
      this.onClick = handlers.onClick ?? null;
      this.onDragStart = handlers.onDragStart ?? null;
      this.onDragEnd = handlers.onDragEnd ?? null;
    }

    setDraggable(draggable: boolean) {
      this.dragEnabled = draggable;
      this.container.style.cursor = draggable ? "grab" : "pointer";
    }

    setContent(
      html: string,
      className: string,
      width: number,
      height: number,
      anchorX: number,
      anchorY: number
    ) {
      this.container.className = className;
      this.container.style.width = `${width}px`;
      this.container.style.height = `${height}px`;
      this.container.style.transform = `translate(${-anchorX}px, ${-anchorY}px)`;
      this.container.innerHTML = html;
    }

    setPosition(position: google.maps.LatLng) {
      this.position = position;
      this.draw();
    }

    onAdd() {
      const panes = this.getPanes();
      panes?.overlayMouseTarget.appendChild(this.container);

      this.container.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!this.dragging) this.onClick?.();
      });

      this.container.addEventListener("mousedown", (event) => {
        if (!this.dragEnabled) return;
        event.preventDefault();
        event.stopPropagation();
        this.dragging = true;
        this.container.style.cursor = "grabbing";
        this.onDragStart?.();

        const map = this.getMap();
        const mapDiv = map instanceof google.maps.Map ? map.getDiv() : null;
        if (map instanceof google.maps.Map) {
          map.setOptions({ draggable: false });
        }

        const onMove = (moveEvent: MouseEvent) => {
          const projection = this.getProjection();
          if (!projection || !mapDiv) return;
          const bounds = mapDiv.getBoundingClientRect();
          const point = new google.maps.Point(
            moveEvent.clientX - bounds.left,
            moveEvent.clientY - bounds.top
          );
          const latLng = projection.fromContainerPixelToLatLng(point);
          if (latLng) {
            this.position = latLng;
            this.draw();
          }
        };

        const onUp = () => {
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mouseup", onUp);
          this.container.style.cursor = "grab";
          if (map instanceof google.maps.Map) {
            map.setOptions({ draggable: true });
          }
          this.onDragEnd?.(this.position);
          window.setTimeout(() => {
            this.dragging = false;
          }, 0);
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
      });
    }

    draw() {
      const projection = this.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToDivPixel(this.position);
      if (!point) return;
      this.container.style.left = `${point.x}px`;
      this.container.style.top = `${point.y}px`;
    }

    onRemove() {
      this.container.remove();
    }
  };
}

/**
 * Google Maps JavaScript API adapter for TalisMaps™ / MapSite™.
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
 */
export class GoogleMapsProvider implements MapProvider {
  readonly id = "google-maps" as const;
  readonly label = "Google Maps";
  readonly description =
    "Google Maps JavaScript API with satellite hybrid imagery. Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.";
  readonly supportedBasemapViews: MapBasemapView[] = [
    "satellite",
    "street",
    "terrain",
    "light",
    "dark",
  ];

  isAvailable(): boolean {
    return typeof window !== "undefined" && Boolean(getGoogleMapsApiKey());
  }

  async mount(container: HTMLElement, options: MapMountOptions): Promise<MapInstance> {
    const signal = options.signal;
    if (signal?.aborted) {
      throw new DOMException("Google Maps mount aborted", "AbortError");
    }

    const apiKey = getGoogleMapsApiKey();
    if (!apiKey) {
      throw new Error(
        "Google Maps requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. Add the key in .env.local and Vercel."
      );
    }

    setOptions({
      key: apiKey,
      v: "weekly",
    });
    await importLibrary("maps");
    await importLibrary("core");

    if (signal?.aborted) {
      throw new DOMException("Google Maps mount aborted", "AbortError");
    }

    const HtmlPinOverlay = createHtmlPinOverlayClass();
    const listeners: ListenerMap = new Map();
    const markers = new Map<string, PinOverlay>();
    const markerIconKeys = new Map<string, string>();
    const markerDraggable = new Map<string, boolean>();
    const mountOwner = Symbol("talismaps-google-maps-mount");

    let pins: MapEnginePin[] = options.pins ?? [];
    let selectedPinId = options.selectedPinId ?? null;
    let draggablePinIds = new Set(options.draggablePinIds ?? []);
    let basemapView = resolveBasemapView(
      options.basemapView,
      this.supportedBasemapViews
    );
    let disposed = false;

    const isCancelled = () => disposed || Boolean(signal?.aborted);

    (
      container as HTMLElement & {
        [CONTAINER_OWNER_KEY]?: symbol;
      }
    )[CONTAINER_OWNER_KEY] = mountOwner;

    container.replaceChildren();
    container.style.position = container.style.position || "relative";

    const map = new google.maps.Map(container, {
      center: {
        lat: options.center.latitude,
        lng: options.center.longitude,
      },
      zoom: options.zoom,
      mapTypeId: basemapToMapTypeId(basemapView),
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      // Pan disabled when center is locked so the pin stays under the card pointer.
      draggable: !options.lockCenter,
      gestureHandling: "greedy",
      clickableIcons: false,
      keyboardShortcuts: !options.lockCenter,
      scrollwheel: true,
    });

    const lockedCenter = options.lockCenter
      ? {
          lat: options.center.latitude,
          lng: options.center.longitude,
        }
      : null;

    const enforceLockedCenter = () => {
      if (!lockedCenter || isCancelled()) return;
      const current = map.getCenter();
      if (!current) return;
      if (
        Math.abs(current.lat() - lockedCenter.lat) > 1e-8 ||
        Math.abs(current.lng() - lockedCenter.lng) > 1e-8
      ) {
        map.setCenter(lockedCenter);
      }
    };

    const emit = (
      event: MapEngineEvent,
      payload?: Parameters<MapEngineEventHandler>[0]
    ) => {
      listeners.get(event)?.forEach((handler) => handler(payload));
    };

    const getViewport = (): MapViewport => {
      const center = lockedCenter
        ? lockedCenter
        : map.getCenter()
          ? {
              lat: map.getCenter()!.lat(),
              lng: map.getCenter()!.lng(),
            }
          : {
              lat: options.center.latitude,
              lng: options.center.longitude,
            };
      return {
        center: {
          latitude: center.lat,
          longitude: center.lng,
        },
        zoom: map.getZoom() ?? options.zoom,
      };
    };

    const removeMarker = (pinId: string) => {
      const marker = markers.get(pinId);
      if (!marker) return;
      marker.setMap(null);
      markers.delete(pinId);
      markerIconKeys.delete(pinId);
      markerDraggable.delete(pinId);
    };

    const upsertMarker = (pin: MapEnginePin) => {
      if (isCancelled()) return;
      const highlighted = pin.id === selectedPinId;
      const iconKey = pinStyleCacheKey(pin, highlighted);
      const shouldDrag = draggablePinIds.has(pin.id);
      const position = new google.maps.LatLng(pin.latitude, pin.longitude);
      const markerHtml = buildPinMarkerHtml(pin, highlighted);

      const existing = markers.get(pin.id);
      if (existing) {
        const iconChanged = markerIconKeys.get(pin.id) !== iconKey;
        const dragChanged = markerDraggable.get(pin.id) !== shouldDrag;
        existing.setPosition(position);
        if (iconChanged) {
          existing.setContent(
            markerHtml.html,
            markerHtml.className || "talismaps-pin-marker",
            markerHtml.iconSize[0],
            markerHtml.iconSize[1],
            markerHtml.iconAnchor[0],
            markerHtml.iconAnchor[1]
          );
          markerIconKeys.set(pin.id, iconKey);
        }
        if (dragChanged) {
          existing.setDraggable(shouldDrag);
          markerDraggable.set(pin.id, shouldDrag);
        }
        return;
      }

      const overlay = new HtmlPinOverlay({
        position,
        html: markerHtml.html,
        className: markerHtml.className || "talismaps-pin-marker",
        width: markerHtml.iconSize[0],
        height: markerHtml.iconSize[1],
        anchorX: markerHtml.iconAnchor[0],
        anchorY: markerHtml.iconAnchor[1],
        draggable: shouldDrag,
      });

      overlay.setHandlers({
        onClick: () => emit("pinclick", { pinId: pin.id }),
        onDragStart: () => emit("pindragstart", { pinId: pin.id }),
        onDragEnd: (latLng) =>
          emit("pindrag", {
            pinId: pin.id,
            coordinates: {
              latitude: latLng.lat(),
              longitude: latLng.lng(),
            },
          }),
      });

      overlay.setMap(map);
      markers.set(pin.id, overlay);
      markerIconKeys.set(pin.id, iconKey);
      markerDraggable.set(pin.id, shouldDrag);
    };

    const syncPins = () => {
      if (isCancelled()) return;
      const nextIds = new Set(pins.map((pin) => pin.id));
      for (const pinId of [...markers.keys()]) {
        if (!nextIds.has(pinId)) removeMarker(pinId);
      }
      for (const pin of pins) {
        upsertMarker(pin);
      }
    };

    const idleListener = map.addListener("idle", () => {
      enforceLockedCenter();
      emit("viewportchange", { viewport: getViewport() });
    });

    // Zoom-toward-cursor and residual pan must not move the locked pin off screen center.
    const centerListener = options.lockCenter
      ? map.addListener("center_changed", () => {
          enforceLockedCenter();
        })
      : null;

    const zoomListener = options.lockCenter
      ? map.addListener("zoom_changed", () => {
          enforceLockedCenter();
        })
      : null;

    const clickListener = map.addListener(
      "click",
      (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return;
        emit("mapclick", {
          coordinates: {
            latitude: event.latLng.lat(),
            longitude: event.latLng.lng(),
          },
        });
      }
    );

    syncPins();

    const instance: MapInstance = {
      destroy() {
        disposed = true;
        idleListener.remove();
        centerListener?.remove();
        zoomListener?.remove();
        clickListener.remove();
        for (const pinId of [...markers.keys()]) {
          removeMarker(pinId);
        }
        const owned = (
          container as HTMLElement & {
            [CONTAINER_OWNER_KEY]?: symbol;
          }
        )[CONTAINER_OWNER_KEY];
        if (owned === mountOwner) {
          container.replaceChildren();
          delete (
            container as HTMLElement & {
              [CONTAINER_OWNER_KEY]?: symbol;
            }
          )[CONTAINER_OWNER_KEY];
        }
      },
      setViewport(viewport: Partial<MapViewport>) {
        if (lockedCenter) {
          // Center stays fixed — only zoom may change.
          if (viewport.zoom !== undefined) {
            map.setZoom(viewport.zoom);
          }
          map.setCenter(lockedCenter);
          return;
        }
        if (viewport.center && viewport.zoom !== undefined) {
          map.setCenter({
            lat: viewport.center.latitude,
            lng: viewport.center.longitude,
          });
          map.setZoom(viewport.zoom);
          return;
        }
        if (viewport.center) {
          map.panTo({
            lat: viewport.center.latitude,
            lng: viewport.center.longitude,
          });
        }
        if (viewport.zoom !== undefined) {
          map.setZoom(viewport.zoom);
        }
      },
      getViewport,
      setPins(nextPins: MapEnginePin[]) {
        pins = nextPins;
        syncPins();
      },
      setSelectedPinId(pinId: string | null) {
        selectedPinId = pinId;
        syncPins();
      },
      setDraggablePinIds(pinIds: string[]) {
        draggablePinIds = new Set(pinIds);
        syncPins();
      },
      setBasemapView(view: MapBasemapView) {
        basemapView = resolveBasemapView(view, [
          "satellite",
          "street",
          "terrain",
          "light",
          "dark",
        ]);
        map.setMapTypeId(basemapToMapTypeId(basemapView));
      },
      getBasemapView() {
        return basemapView;
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
        if (coordinates.length === 0) return;
        if (coordinates.length === 1) {
          map.setCenter({
            lat: coordinates[0]!.latitude,
            lng: coordinates[0]!.longitude,
          });
          map.setZoom(15);
          return;
        }
        const bounds = new google.maps.LatLngBounds();
        for (const coordinate of coordinates) {
          bounds.extend({
            lat: coordinate.latitude,
            lng: coordinate.longitude,
          });
        }
        map.fitBounds(bounds, padding);
      },
      on(event: MapEngineEvent, handler: MapEngineEventHandler) {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event)!.add(handler);
      },
      off(event: MapEngineEvent, handler: MapEngineEventHandler) {
        listeners.get(event)?.delete(handler);
      },
    };

    return instance;
  }
}
