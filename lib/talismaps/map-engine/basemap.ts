import type {
  MapBasemapView,
  MapBasemapViewOption,
  MapProviderId,
} from "./types";

/**
 * Canonical basemap view catalog.
 * Providers declare which of these they support — callers never pick tile URLs.
 */
export const MAP_BASEMAP_VIEW_OPTIONS: MapBasemapViewOption[] = [
  {
    id: "street",
    label: "Street",
    description: "Standard road and label cartography.",
    availability: "available",
  },
  {
    id: "satellite",
    label: "Satellite",
    description: "Aerial / satellite imagery basemap.",
    availability: "available",
  },
  {
    id: "hybrid",
    label: "Hybrid",
    description: "Satellite imagery with road / place labels overlaid.",
    availability: "future",
  },
  {
    id: "terrain",
    label: "Terrain",
    description: "Topographic relief and elevation cues.",
    availability: "future",
  },
];

export const DEFAULT_MAP_BASEMAP_VIEW: MapBasemapView = "street";

export function isMapBasemapView(value: unknown): value is MapBasemapView {
  return (
    value === "street" ||
    value === "satellite" ||
    value === "hybrid" ||
    value === "terrain"
  );
}

export function isMapProviderId(value: unknown): value is MapProviderId {
  return (
    value === "leaflet-osm" ||
    value === "mapbox" ||
    value === "google-maps" ||
    value === "esri"
  );
}

export function parseMapBasemapView(
  value: unknown,
  fallback: MapBasemapView = DEFAULT_MAP_BASEMAP_VIEW
): MapBasemapView {
  return isMapBasemapView(value) ? value : fallback;
}

/**
 * Whether free, unrestricted commercial satellite imagery exists for a provider
 * without paid credentials. Used for production defaults.
 */
export function providerSupportsUnrestrictedSatellite(
  providerId: MapProviderId
): boolean {
  // OpenStreetMap tiles are street-only; Esri/Mapbox/Google satellite require
  // accounts and paid/commercial licensing for production apps.
  void providerId;
  return false;
}
