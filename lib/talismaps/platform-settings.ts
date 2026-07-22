import {
  DEFAULT_MAP_BASEMAP_VIEW,
  DEFAULT_MAP_PROVIDER_ID,
  isMapBasemapView,
  isMapProviderId,
  normalizeLegacyBasemapView,
  normalizeLegacyProviderId,
  resolveProviderBasemapView,
  type MapBasemapView,
  type MapProviderId,
} from "@/lib/talismaps/map-engine";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export interface TalisMapsPlatformSettings {
  defaultProviderId: MapProviderId;
  defaultBasemapView: MapBasemapView;
  updatedAt: string | null;
  updatedBy: string | null;
}

export const FALLBACK_PLATFORM_SETTINGS: TalisMapsPlatformSettings = {
  defaultProviderId: DEFAULT_MAP_PROVIDER_ID,
  defaultBasemapView: DEFAULT_MAP_BASEMAP_VIEW,
  updatedAt: null,
  updatedBy: null,
};

function normalizeSettings(row: {
  default_provider_id?: string | null;
  default_basemap_view?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
} | null): TalisMapsPlatformSettings {
  const providerId =
    normalizeLegacyProviderId(row?.default_provider_id) ??
    (isMapProviderId(row?.default_provider_id)
      ? row.default_provider_id
      : FALLBACK_PLATFORM_SETTINGS.defaultProviderId);

  const preferredView =
    normalizeLegacyBasemapView(row?.default_basemap_view) ??
    (isMapBasemapView(row?.default_basemap_view)
      ? row.default_basemap_view
      : FALLBACK_PLATFORM_SETTINGS.defaultBasemapView);

  return {
    defaultProviderId: providerId,
    defaultBasemapView: resolveProviderBasemapView(providerId, preferredView),
    updatedAt: row?.updated_at ?? null,
    updatedBy: row?.updated_by ?? null,
  };
}

export async function getTalisMapsPlatformSettings(): Promise<TalisMapsPlatformSettings> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("talismaps_platform_settings")
      .select("default_provider_id, default_basemap_view, updated_at, updated_by")
      .eq("id", "global")
      .maybeSingle();

    if (error) {
      console.warn("[talismaps] platform settings read failed:", error.message);
      return FALLBACK_PLATFORM_SETTINGS;
    }

    return normalizeSettings(data);
  } catch (error) {
    console.warn("[talismaps] platform settings unavailable:", error);
    return FALLBACK_PLATFORM_SETTINGS;
  }
}

export async function updateTalisMapsPlatformSettings(input: {
  defaultProviderId: MapProviderId;
  defaultBasemapView: MapBasemapView;
  updatedBy?: string | null;
}): Promise<{ ok: true; settings: TalisMapsPlatformSettings } | { ok: false; error: string }> {
  const providerId =
    normalizeLegacyProviderId(input.defaultProviderId) ??
    (isMapProviderId(input.defaultProviderId) ? input.defaultProviderId : null);
  if (!providerId) {
    return { ok: false, error: "Invalid map provider." };
  }

  const preferredView =
    normalizeLegacyBasemapView(input.defaultBasemapView) ??
    (isMapBasemapView(input.defaultBasemapView) ? input.defaultBasemapView : null);
  if (!preferredView) {
    return { ok: false, error: "Invalid map style." };
  }

  const basemapView = resolveProviderBasemapView(providerId, preferredView);

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("talismaps_platform_settings")
      .upsert(
        {
          id: "global",
          default_provider_id: providerId,
          default_basemap_view: basemapView,
          updated_at: new Date().toISOString(),
          updated_by: input.updatedBy ?? null,
        },
        { onConflict: "id" }
      )
      .select("default_provider_id, default_basemap_view, updated_at, updated_by")
      .single();

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, settings: normalizeSettings(data) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to save settings.",
    };
  }
}
