import {
  DEFAULT_MAP_BASEMAP_VIEW,
  isMapProviderId,
  normalizeLegacyProviderId,
} from "./basemap";
import { EsriProvider, MapboxProvider } from "./providers/stub-providers";
import type {
  MapBasemapView,
  MapMountOptions,
  MapProvider,
  MapProviderDescriptor,
  MapProviderId,
} from "./types";

/**
 * Lazy Google Maps adapter — keeps @googlemaps/js-api-loader out of Edge graphs.
 */
const GoogleMapsLazyProvider: MapProvider = {
  id: "google-maps",
  label: "Google Maps",
  description:
    "Google Maps JavaScript API with satellite hybrid imagery. Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.",
  supportedBasemapViews: ["satellite", "street", "terrain", "light", "dark"],
  isAvailable() {
    if (typeof window === "undefined") return false;
    const key =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
      process.env.NEXT_PUBLIC_TALISMAPS_GOOGLE_MAPS_API_KEY?.trim();
    return Boolean(key);
  },
  async mount(container: HTMLElement, options: MapMountOptions) {
    const { GoogleMapsProvider } = await import(
      "./providers/google-maps-provider"
    );
    return new GoogleMapsProvider().mount(container, options);
  },
};

/**
 * Lazy MapLibre adapter — keeps maplibre-gl out of Edge / middleware graphs.
 */
const MapLibreLazyProvider: MapProvider = {
  id: "maplibre",
  label: "MapLibre GL JS",
  description:
    "Open-source vector rendering engine with interchangeable tile styles (MapTiler Satellite by default).",
  supportedBasemapViews: ["satellite", "street", "terrain", "light", "dark"],
  isAvailable() {
    return typeof window !== "undefined";
  },
  async mount(container: HTMLElement, options: MapMountOptions) {
    const { MapLibreProvider } = await import("./providers/maplibre-provider");
    return new MapLibreProvider().mount(container, options);
  },
};

const PROVIDERS: Record<MapProviderId, MapProvider> = {
  "google-maps": GoogleMapsLazyProvider,
  maplibre: MapLibreLazyProvider,
  mapbox: MapboxProvider,
  esri: EsriProvider,
};

function resolveEnvProviderId(): MapProviderId {
  const raw = process.env.NEXT_PUBLIC_TALISMAPS_MAP_PROVIDER;
  const normalized = normalizeLegacyProviderId(raw);
  if (normalized) return normalized;
  if (isMapProviderId(raw)) return raw;
  // Prefer Google Maps when a key is configured; otherwise MapLibre.
  if (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_TALISMAPS_GOOGLE_MAPS_API_KEY?.trim()
  ) {
    return "google-maps";
  }
  return "maplibre";
}

export const DEFAULT_MAP_PROVIDER_ID: MapProviderId = resolveEnvProviderId();

export function createMapProvider(
  providerId: MapProviderId = DEFAULT_MAP_PROVIDER_ID
): MapProvider {
  const provider = PROVIDERS[providerId];
  if (!provider) {
    throw new Error(`Unknown map provider: ${providerId}`);
  }
  return provider;
}

export function listMapProviders(): MapProviderDescriptor[] {
  return (Object.keys(PROVIDERS) as MapProviderId[]).map((id) => {
    const provider = PROVIDERS[id];
    return {
      id: provider.id,
      label: provider.label,
      description: provider.description,
      isAvailable: provider.isAvailable(),
      supportedBasemapViews: provider.supportedBasemapViews,
    };
  });
}

export function getDefaultMapProvider(): MapProvider {
  const preferred = createMapProvider(DEFAULT_MAP_PROVIDER_ID);
  if (preferred.isAvailable()) {
    return preferred;
  }
  // Fall back to MapLibre if Google key is missing.
  return createMapProvider("maplibre");
}

export function resolveProviderBasemapView(
  providerId: MapProviderId,
  preferred: MapBasemapView = DEFAULT_MAP_BASEMAP_VIEW
): MapBasemapView {
  const provider = createMapProvider(providerId);
  if (provider.supportedBasemapViews.includes(preferred)) {
    return preferred;
  }
  return (
    provider.supportedBasemapViews.find((view) => view === "satellite") ??
    provider.supportedBasemapViews[0] ??
    DEFAULT_MAP_BASEMAP_VIEW
  );
}
