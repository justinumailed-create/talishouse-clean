/**
 * Tile / style configuration for TalisMaps™.
 *
 * MapLibre GL JS is the rendering engine. MapTiler Cloud supplies style URLs —
 * business logic never imports the MapTiler SDK.
 */

export type TalisMapsTileVendorId = "maptiler";

/**
 * Provider-agnostic map style identifiers.
 * The Style Manager maps these to MapTiler MapLibre style URLs.
 */
export type MapStyleId =
  | "satellite"
  | "street"
  | "terrain"
  | "light"
  | "dark";

export interface MapStyleDefinition {
  id: MapStyleId;
  label: string;
  description: string;
}

export const MAP_STYLE_DEFINITIONS: MapStyleDefinition[] = [
  {
    id: "satellite",
    label: "Satellite",
    description:
      "High-resolution aerial imagery without place or business labels (TalisMaps™ pins only).",
  },
  {
    id: "street",
    label: "Streets",
    description: "Road network cartography without third-party business POIs.",
  },
  {
    id: "terrain",
    label: "Terrain",
    description: "Topographic relief for outdoor and elevation context.",
  },
  {
    id: "light",
    label: "Light",
    description: "Minimal light basemap for data overlays.",
  },
  {
    id: "dark",
    label: "Dark",
    description: "Minimal dark basemap for night / dark UI surfaces.",
  },
];

export const DEFAULT_MAP_STYLE_ID: MapStyleId = "satellite";

export const ALL_MAP_STYLE_IDS: MapStyleId[] = MAP_STYLE_DEFINITIONS.map(
  (style) => style.id
);

export function isMapStyleId(value: unknown): value is MapStyleId {
  return (
    value === "satellite" ||
    value === "street" ||
    value === "terrain" ||
    value === "light" ||
    value === "dark"
  );
}

/** @deprecated Use MapStyleId. Kept as alias for existing platform settings fields. */
export type MapBasemapView = MapStyleId;

export function getTileVendorId(): TalisMapsTileVendorId {
  return "maptiler";
}

export function getMapTilerApiKey(): string {
  return (
    process.env.NEXT_PUBLIC_MAPTILER_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_TALISMAPS_MAPTILER_API_KEY?.trim() ||
    "YOUR_MAPTILER_API_KEY"
  );
}

/**
 * Optional full MapTiler (or compatible) style URL overrides.
 * Example: NEXT_PUBLIC_TALISMAPS_STYLE_SATELLITE=https://api.maptiler.com/maps/...
 */
export function getCustomStyleUrlOverride(styleId: MapStyleId): string | null {
  const envKey = `NEXT_PUBLIC_TALISMAPS_STYLE_${styleId.toUpperCase()}`;
  const value = process.env[envKey]?.trim();
  return value || null;
}
