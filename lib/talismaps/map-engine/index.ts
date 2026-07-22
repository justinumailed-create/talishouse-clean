export type {
  MapBasemapView,
  MapBasemapViewAvailability,
  MapBasemapViewOption,
  MapCoordinates,
  MapEngineEvent,
  MapEngineEventHandler,
  MapEngineEventPayload,
  MapEnginePin,
  MapInstance,
  MapMapClickEvent,
  MapMountOptions,
  MapPinClickEvent,
  MapPinDragEvent,
  MapPinDragStartEvent,
  MapProvider,
  MapProviderDescriptor,
  MapProviderId,
  MapViewport,
  MapViewportChangeEvent,
} from "./types";

export {
  DEFAULT_MAP_BASEMAP_VIEW,
  MAP_BASEMAP_VIEW_OPTIONS,
  isMapBasemapView,
  isMapProviderId,
  normalizeLegacyBasemapView,
  normalizeLegacyProviderId,
  parseMapBasemapView,
  parseMapStyleId,
  providerSupportsUnrestrictedSatellite,
} from "./basemap";

export {
  ALL_MAP_STYLE_IDS,
  DEFAULT_MAP_STYLE_ID,
  MAP_STYLE_DEFINITIONS,
  MapStyleManager,
  getCustomStyleUrlOverride,
  getMapStyleManager,
  getMapTilerApiKey,
  getTileVendorId,
  isMapStyleId,
  resetMapStyleManager,
  type MapStyleDefinition,
  type MapStyleId,
  type ResolvedMapStyle,
  type TalisMapsTileVendorId,
} from "./styles";

export { toMapEnginePin, toMapEnginePins } from "./pin-adapters";
export {
  createMapProvider,
  DEFAULT_MAP_PROVIDER_ID,
  getDefaultMapProvider,
  listMapProviders,
  resolveProviderBasemapView,
} from "./registry";

/** Lazy accessor — prefer createMapProvider("maplibre") in app code. */
export async function loadMapLibreProvider() {
  const { MapLibreProvider } = await import("./providers/maplibre-provider");
  return new MapLibreProvider();
}
