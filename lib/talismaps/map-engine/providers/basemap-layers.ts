/**
 * Provider-owned basemap layer descriptors.
 * Consumers request a MapBasemapView; only providers resolve concrete tiles.
 */

import type { MapBasemapView } from "../types";

export interface ProviderBasemapLayer {
  view: MapBasemapView;
  urlTemplate: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
}

/** OpenStreetMap standard raster tiles (street). */
export const OSM_STREET_LAYER: ProviderBasemapLayer = {
  view: "street",
  urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 19,
  subdomains: ["a", "b", "c"],
};

/**
 * Esri World Imagery — optional satellite layer for the Leaflet adapter.
 * Commercial/production use typically requires ArcGIS Location Platform terms.
 * Exposed only as a basemap option, never as a hardcoded consumer dependency.
 */
export const ESRI_SATELLITE_LAYER: ProviderBasemapLayer = {
  view: "satellite",
  urlTemplate:
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution:
    "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  maxZoom: 19,
};

const LEAFLET_BASEMAP_LAYERS: Partial<Record<MapBasemapView, ProviderBasemapLayer>> =
  {
    street: OSM_STREET_LAYER,
    satellite: ESRI_SATELLITE_LAYER,
  };

export function resolveLeafletBasemapLayer(
  view: MapBasemapView
): ProviderBasemapLayer {
  return LEAFLET_BASEMAP_LAYERS[view] ?? OSM_STREET_LAYER;
}
