import {
  DEFAULT_MAP_STYLE_ID,
  MAP_STYLE_DEFINITIONS,
  isMapStyleId,
  type MapStyleId,
} from "./styles";
import type {
  MapBasemapView,
  MapBasemapViewOption,
  MapProviderId,
} from "./types";

/**
 * Canonical basemap / style catalog.
 * Providers declare which of these they support — callers never pick tile URLs.
 */
export const MAP_BASEMAP_VIEW_OPTIONS: MapBasemapViewOption[] =
  MAP_STYLE_DEFINITIONS.map((style) => ({
    id: style.id,
    label: style.label,
    description: style.description,
    availability: "available" as const,
  }));

export const DEFAULT_MAP_BASEMAP_VIEW: MapBasemapView = DEFAULT_MAP_STYLE_ID;

export function isMapBasemapView(value: unknown): value is MapBasemapView {
  return isMapStyleId(value);
}

export function isMapProviderId(value: unknown): value is MapProviderId {
  return value === "maplibre" || value === "mapbox" || value === "esri";
}

/**
 * Accept legacy stored ids from older platform settings rows.
 */
export function normalizeLegacyProviderId(value: unknown): MapProviderId | null {
  if (isMapProviderId(value)) return value;
  if (value === "leaflet-osm" || value === "google-maps") {
    return "maplibre";
  }
  return null;
}

/**
 * Accept legacy basemap ids (e.g. hybrid) from older settings.
 */
export function normalizeLegacyBasemapView(value: unknown): MapBasemapView | null {
  if (isMapBasemapView(value)) return value;
  if (value === "hybrid") return "satellite";
  return null;
}

export function parseMapBasemapView(
  value: unknown,
  fallback: MapBasemapView = DEFAULT_MAP_BASEMAP_VIEW
): MapBasemapView {
  return normalizeLegacyBasemapView(value) ?? fallback;
}

export function parseMapStyleId(
  value: unknown,
  fallback: MapStyleId = DEFAULT_MAP_STYLE_ID
): MapStyleId {
  return isMapStyleId(value) ? value : fallback;
}

/**
 * Whether free, unrestricted commercial satellite imagery exists without paid credentials.
 */
export function providerSupportsUnrestrictedSatellite(
  providerId: MapProviderId
): boolean {
  // MapLibre + MapTiler satellite requires a MapTiler key for production.
  void providerId;
  return false;
}
