import type {
  MapBasemapView,
  MapMountOptions,
  MapProvider,
  MapProviderId,
} from "../types";

function createStubProvider(config: {
  id: MapProviderId;
  label: string;
  description: string;
  supportedBasemapViews: MapBasemapView[];
  isAvailable: () => boolean;
}): MapProvider {
  return {
    id: config.id,
    label: config.label,
    description: config.description,
    supportedBasemapViews: config.supportedBasemapViews,
    isAvailable: config.isAvailable,
    async mount(_container: HTMLElement, _options: MapMountOptions) {
      throw new Error(
        `${config.label} provider is registered but not mounted yet. Configure credentials and enable the adapter to use it through MapProvider.`
      );
    },
  };
}

export const MapboxProvider = createStubProvider({
  id: "mapbox",
  label: "Mapbox",
  description:
    "Mapbox GL streets, satellite, and terrain styles. Requires NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.",
  supportedBasemapViews: ["street", "satellite", "hybrid", "terrain"],
  isAvailable: () => Boolean(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN),
});

export const GoogleMapsProvider = createStubProvider({
  id: "google-maps",
  label: "Google Maps",
  description:
    "Google Maps JavaScript API. Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.",
  supportedBasemapViews: ["street", "satellite", "hybrid", "terrain"],
  isAvailable: () => Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
});

export const EsriProvider = createStubProvider({
  id: "esri",
  label: "ESRI World Imagery",
  description:
    "ArcGIS Location Platform / World Imagery. Requires NEXT_PUBLIC_ESRI_API_KEY for production licensing.",
  supportedBasemapViews: ["street", "satellite", "hybrid", "terrain"],
  isAvailable: () => Boolean(process.env.NEXT_PUBLIC_ESRI_API_KEY),
});
