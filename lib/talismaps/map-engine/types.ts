export type MapProviderId = "google-maps" | "maplibre" | "mapbox" | "esri";

/**
 * Provider-agnostic map visual / style mode.
 * Providers translate these into Google map types or MapLibre style URLs.
 * Never pass vendor SDK types across this boundary.
 */
export type MapBasemapView =
  | "satellite"
  | "street"
  | "terrain"
  | "light"
  | "dark";

export type MapBasemapViewAvailability = "available" | "future" | "unavailable";

export interface MapBasemapViewOption {
  id: MapBasemapView;
  label: string;
  description: string;
  availability: MapBasemapViewAvailability;
}

export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

export interface MapViewport {
  center: MapCoordinates;
  zoom: number;
}

export interface MapEnginePin {
  id: string;
  latitude: number;
  longitude: number;
  label?: string;
  color?: string;
  featured?: boolean;
  metadata?: Record<string, unknown>;
}

export interface MapMountOptions {
  center: MapCoordinates;
  zoom: number;
  pins?: MapEnginePin[];
  selectedPinId?: string | null;
  draggablePinIds?: string[];
  /** Preferred visual mode — providers map this to their own styles/tiles. */
  basemapView?: MapBasemapView;
  /**
   * Abort in-flight mounts (React Strict Mode remounts).
   * When aborted, the provider must not clear a container owned by a newer mount.
   */
  signal?: AbortSignal;
}

export type MapEngineEvent =
  | "viewportchange"
  | "pinclick"
  | "mapclick"
  | "pindrag"
  | "pindragstart";

export interface MapViewportChangeEvent {
  viewport: MapViewport;
}

export interface MapPinClickEvent {
  pinId: string;
}

export interface MapMapClickEvent {
  coordinates: MapCoordinates;
}

export interface MapPinDragEvent {
  pinId: string;
  coordinates: MapCoordinates;
}

export interface MapPinDragStartEvent {
  pinId: string;
}

export type MapEngineEventPayload =
  | MapViewportChangeEvent
  | MapPinClickEvent
  | MapMapClickEvent
  | MapPinDragEvent
  | MapPinDragStartEvent
  | undefined;

export type MapEngineEventHandler = (payload?: MapEngineEventPayload) => void;

export interface MapInstance {
  destroy(): void;
  setViewport(viewport: Partial<MapViewport>): void;
  getViewport(): MapViewport;
  setPins(pins: MapEnginePin[]): void;
  setSelectedPinId(pinId: string | null): void;
  setDraggablePinIds(pinIds: string[]): void;
  setBasemapView?(view: MapBasemapView): void;
  getBasemapView?(): MapBasemapView;
  fitToPins(padding?: number): void;
  fitToCoordinates(coordinates: MapCoordinates[], padding?: number): void;
  on(event: MapEngineEvent, handler: MapEngineEventHandler): void;
  off(event: MapEngineEvent, handler: MapEngineEventHandler): void;
}

/**
 * Provider-agnostic map engine contract.
 * All TalisMaps™ surfaces mount maps through this interface.
 * Implementations may use Google Maps, MapLibre, Mapbox GL, etc.
 */
export interface MapProvider {
  readonly id: MapProviderId;
  readonly label: string;
  readonly description: string;
  /** Basemap / style views this provider can render today. */
  readonly supportedBasemapViews: MapBasemapView[];
  isAvailable(): boolean;
  mount(container: HTMLElement, options: MapMountOptions): Promise<MapInstance>;
}

export interface MapProviderDescriptor {
  id: MapProviderId;
  label: string;
  description: string;
  isAvailable: boolean;
  supportedBasemapViews: MapBasemapView[];
}
