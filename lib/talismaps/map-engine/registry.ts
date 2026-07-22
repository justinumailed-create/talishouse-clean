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
  maplibre: MapLibreLazyProvider,
  mapbox: MapboxProvider,
  esri: EsriProvider,
};

function resolveEnvProviderId(): MapProviderId {
  const raw = process.env.NEXT_PUBLIC_TALISMAPS_MAP_PROVIDER;
  const normalized = normalizeLegacyProviderId(raw);
  if (normalized) return normalized;
  if (isMapProviderId(raw)) return raw;
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
