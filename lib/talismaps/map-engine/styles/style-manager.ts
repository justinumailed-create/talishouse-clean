import {
  getCustomStyleUrlOverride,
  getMapTilerApiKey,
  type MapStyleId,
} from "./types";

/**
 * MapTiler Cloud → MapLibre style URL templates.
 * TalisMaps™ uses MapTiler exclusively for basemap styles.
 */
type StyleUrlMap = Record<MapStyleId, string>;

function mapTilerStyleUrls(apiKey: string): StyleUrlMap {
  const key = encodeURIComponent(apiKey);
  return {
    // Hybrid = high-res satellite-v2 imagery + road/place labels (matches Google-style reference).
    // Plain `satellite` alone looks soft when overzoomed and has no street context.
    satellite: `https://api.maptiler.com/maps/hybrid/style.json?key=${key}`,
    street: `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`,
    terrain: `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${key}`,
    light: `https://api.maptiler.com/maps/basic-v2/style.json?key=${key}`,
    dark: `https://api.maptiler.com/maps/basic-v2-dark/style.json?key=${key}`,
  };
}

export interface ResolvedMapStyle {
  styleId: MapStyleId;
  styleUrl: string;
  vendor: "maptiler";
  /** True when using the placeholder MapTiler key. */
  usingPlaceholderKey: boolean;
}

function isPlaceholderKey(apiKey: string): boolean {
  return apiKey === "YOUR_MAPTILER_API_KEY" || apiKey.length < 8;
}

/**
 * Map Style Manager — resolves style IDs to MapTiler MapLibre style URLs.
 * Callers request a style id; they never hard-code vendor URLs.
 */
export class MapStyleManager {
  getVendor(): "maptiler" {
    return "maptiler";
  }

  listStyles(): MapStyleId[] {
    return Object.keys(mapTilerStyleUrls(getMapTilerApiKey())) as MapStyleId[];
  }

  resolve(styleId: MapStyleId): ResolvedMapStyle {
    const apiKey = getMapTilerApiKey();
    const override = getCustomStyleUrlOverride(styleId);
    const catalog = mapTilerStyleUrls(apiKey);
    const styleUrl = override ?? catalog[styleId];

    return {
      styleId,
      styleUrl,
      vendor: "maptiler",
      usingPlaceholderKey: !override && isPlaceholderKey(apiKey),
    };
  }
}

let sharedManager: MapStyleManager | null = null;

export function getMapStyleManager(): MapStyleManager {
  if (!sharedManager) {
    sharedManager = new MapStyleManager();
  }
  return sharedManager;
}

/** Reset cached manager (tests / hot env changes). */
export function resetMapStyleManager(): void {
  sharedManager = null;
}
