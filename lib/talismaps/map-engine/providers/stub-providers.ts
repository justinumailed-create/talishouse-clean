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
        `${config.label} provider is registered but not mounted yet. Configure credentials and enable the adapter to use it through MapProvider. Google Maps is not supported.`
      );
    },
  };
}

export const MapboxProvider = createStubProvider({
  id: "mapbox",
  label: "Mapbox (planned)",
  description:
    "Optional future Mapbox GL style adapter. Requires NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN. Not required for TalisMaps™ — prefer MapLibre.",
  supportedBasemapViews: ["satellite", "street", "terrain", "light", "dark"],
  isAvailable: () => Boolean(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN),
});

export const EsriProvider = createStubProvider({
  id: "esri",
  label: "ESRI (planned)",
  description:
    "Optional future ArcGIS style adapter. Requires NEXT_PUBLIC_ESRI_API_KEY. Not required for TalisMaps™ — prefer MapLibre.",
  supportedBasemapViews: ["satellite", "street", "terrain"],
  isAvailable: () => Boolean(process.env.NEXT_PUBLIC_ESRI_API_KEY),
});
