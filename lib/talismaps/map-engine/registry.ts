import { DEFAULT_MAP_BASEMAP_VIEW, isMapProviderId } from "./basemap";
import { LeafletOpenStreetMapProvider } from "./providers/leaflet-osm-provider";
import {
  EsriProvider,
  GoogleMapsProvider,
  MapboxProvider,
} from "./providers/stub-providers";
import type {
  MapBasemapView,
  MapProvider,
  MapProviderDescriptor,
  MapProviderId,
} from "./types";

const PROVIDERS: Record<MapProviderId, MapProvider> = {
  "leaflet-osm": new LeafletOpenStreetMapProvider(),
  mapbox: MapboxProvider,
  "google-maps": GoogleMapsProvider,
  esri: EsriProvider,
};

function resolveEnvProviderId(): MapProviderId {
  const raw = process.env.NEXT_PUBLIC_TALISMAPS_MAP_PROVIDER;
  if (isMapProviderId(raw)) return raw;
  return "leaflet-osm";
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
  return createMapProvider("leaflet-osm");
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
    provider.supportedBasemapViews.find((view) => view === "street") ??
    provider.supportedBasemapViews[0] ??
    DEFAULT_MAP_BASEMAP_VIEW
  );
}
