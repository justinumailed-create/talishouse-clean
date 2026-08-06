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

/** Hide third-party business / POI branding — Talismaps™ pins are the only markers. */
const NO_THIRD_PARTY_POI_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.attraction", stylers: [{ visibility: "off" }] },
  { featureType: "poi.place_of_worship", stylers: [{ visibility: "off" }] },
  { featureType: "poi.school", stylers: [{ visibility: "off" }] },
  { featureType: "poi.sports_complex", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "transit.station", stylers: [{ visibility: "off" }] },
];

function basemapToMapTypeId(view: MapBasemapView): string {
  switch (view) {
    case "satellite":
      // Pure satellite — not hybrid — so Google POI / business labels never appear.
      return "satellite";
    case "terrain":
      return "terrain";
    case "street":
    case "light":
    case "dark":
    default:
      return "roadmap";
  }
}

function stylesForBasemap(view: MapBasemapView): google.maps.MapTypeStyle[] {
  // Satellite imagery ignores styles; still attach for roadmap/terrain modes.
  if (view === "satellite") return [];
  return NO_THIRD_PARTY_POI_STYLES;
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
 * Preserves Talismaps™ pin styling without requiring a Cloud Map ID.
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
      this.container.style.overflow = "visible";
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

    private moveToClientPoint(clientX: number, clientY: number) {
      const projection = this.getProjection();
      const map = this.getMap();
      const mapDiv = map instanceof google.maps.Map ? map.getDiv() : null;
      if (!projection || !mapDiv) return;
      const bounds = mapDiv.getBoundingClientRect();
      const point = new google.maps.Point(
        clientX - bounds.left,
        clientY - bounds.top
      );
      const latLng = projection.fromContainerPixelToLatLng(point);
      if (latLng) {
        this.position = latLng;
        this.draw();
      }
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
        if (map instanceof google.maps.Map) {
          map.setOptions({ draggable: false });
        }

        const onMove = (moveEvent: MouseEvent) => {
          this.moveToClientPoint(moveEvent.clientX, moveEvent.clientY);
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

      this.container.addEventListener(
        "touchstart",
        (event) => {
          if (!this.dragEnabled) return;
          const touch = event.touches[0];
          if (!touch || event.touches.length > 1) return;
          // Stops the map from panning and blocks the synthetic click after drop.
          event.preventDefault();
          event.stopPropagation();
          const pointerId = touch.identifier;
          this.dragging = true;
          this.onDragStart?.();

          const map = this.getMap();
          if (map instanceof google.maps.Map) {
            map.setOptions({ draggable: false });
          }

          const trackedTouch = (touchEvent: TouchEvent) =>
            Array.from(touchEvent.changedTouches).find(
              (candidate) => candidate.identifier === pointerId
            ) ?? null;

          const onMove = (moveEvent: TouchEvent) => {
            const active = trackedTouch(moveEvent);
            if (!active) return;
            moveEvent.preventDefault();
            this.moveToClientPoint(active.clientX, active.clientY);
          };

          const onEnd = (endEvent: TouchEvent) => {
            const active = trackedTouch(endEvent);
            if (!active) return;
            window.removeEventListener("touchmove", onMove);
            window.removeEventListener("touchend", onEnd);
            window.removeEventListener("touchcancel", onEnd);
            if (map instanceof google.maps.Map) {
              map.setOptions({ draggable: true });
            }
            if (endEvent.type !== "touchcancel") {
              this.moveToClientPoint(active.clientX, active.clientY);
              this.onDragEnd?.(this.position);
            }
            window.setTimeout(() => {
              this.dragging = false;
            }, 0);
          };

          window.addEventListener("touchmove", onMove, { passive: false });
          window.addEventListener("touchend", onEnd);
          window.addEventListener("touchcancel", onEnd);
        },
        { passive: false }
      );
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
 * Google Maps JavaScript API adapter for Talismaps™ / Mapsite™.
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
 */
export class GoogleMapsProvider implements MapProvider {
  readonly id = "google-maps" as const;
  readonly label = "Google Maps";
  readonly description =
    "Google Maps JavaScript API with satellite imagery (no third-party POI labels). Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.";
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
      styles: stylesForBasemap(basemapView),
      // Platform chrome only — hide Google default UI / attribution chrome.
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      scaleControl: false,
      rotateControl: false,
      // Pan disabled when center is locked so the pin stays under the card pointer.
      draggable: !options.lockCenter,
      gestureHandling: "greedy",
      clickableIcons: false,
      keyboardShortcuts: false,
      scrollwheel: true,
    });

    // Soft-hide residual Google logo / terms chrome if the API still injects it.
    container.classList.add("talismaps-map-host");

    const lockedCenter = options.lockCenter
      ? {
          lat: options.center.latitude,
          lng: options.center.longitude,
        }
      : null;

    let screenOffset = {
      x: options.lockCenterOffset?.x ?? 0,
      y: options.lockCenterOffset?.y ?? 0,
    };
    let placingLockedPin = false;
    /** Ignore zoom/drag events caused by setViewport (not user gestures). */
    let suppressCameraGestureEvents = false;

    const placeLockedPin = () => {
      if (!lockedCenter || placingLockedPin || isCancelled()) return;
      placingLockedPin = true;
      map.setCenter(lockedCenter);
      if (screenOffset.x !== 0 || screenOffset.y !== 0) {
        // panBy moves the map; negate so the lat/lng shifts on-screen by offset.
        map.panBy(-screenOffset.x, -screenOffset.y);
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          placingLockedPin = false;
        });
      });
    };

    const enforceLockedCenter = () => {
      if (!lockedCenter || isCancelled() || placingLockedPin) return;
      placeLockedPin();
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
      emit("viewportchange", { viewport: getViewport() });
    });

    // Zoom-toward-cursor and residual pan must not move the locked pin off its tip target.
    const centerListener = options.lockCenter
      ? map.addListener("center_changed", () => {
          if (placingLockedPin) return;
          enforceLockedCenter();
        })
      : null;

    const zoomListener = options.lockCenter
      ? map.addListener("zoom_changed", () => {
          if (placingLockedPin) return;
          enforceLockedCenter();
        })
      : map.addListener("zoom_changed", () => {
          if (suppressCameraGestureEvents) return;
          emit("mapzoom");
        });

    const dragStartListener = options.lockCenter
      ? null
      : map.addListener("dragstart", () => {
          if (suppressCameraGestureEvents) return;
          emit("mapdragstart");
        });

    if (options.lockCenter) {
      placeLockedPin();
    }

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
        dragStartListener?.remove();
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
      setLockCenterOffset(offset: { x: number; y: number }) {
        screenOffset = { x: offset.x, y: offset.y };
        placeLockedPin();
      },
      setViewport(viewport: Partial<MapViewport>) {
        suppressCameraGestureEvents = true;
        try {
          if (lockedCenter) {
            // Center stays fixed — only zoom may change.
            if (viewport.zoom !== undefined) {
              map.setZoom(viewport.zoom);
            }
            placeLockedPin();
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
        } finally {
          // zoom_changed / related listeners fire synchronously during setZoom.
          suppressCameraGestureEvents = false;
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
        map.setOptions({ styles: stylesForBasemap(basemapView) });
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
