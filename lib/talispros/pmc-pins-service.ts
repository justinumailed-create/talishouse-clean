import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  mergePmcPinDefaults,
  PMC_DEFAULT_REGIONAL_PINS,
  type PmcCountry,
  type PmcRegionGroup,
  type PmcRegionalPin,
} from "@/lib/talispros/pmc-regional-pins";

type PmcPinRow = {
  id: string;
  country: string;
  region_group: string;
  label: string;
  latitude: number;
  longitude: number;
  map_zoom: number;
  pin_color: string | null;
  logo_url: string | null;
  visible: boolean;
  sort_order: number;
  description: string | null;
};

function rowToPartial(row: PmcPinRow): Partial<PmcRegionalPin> {
  return {
    id: row.id,
    country: row.country as PmcCountry,
    regionGroup: row.region_group as PmcRegionGroup,
    label: row.label,
    latitude: row.latitude,
    longitude: row.longitude,
    mapZoom: row.map_zoom,
    pinColor: row.pin_color ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    visible: row.visible,
    sortOrder: row.sort_order,
    description: row.description ?? undefined,
  };
}

export async function listPmcRegionalPins(): Promise<PmcRegionalPin[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await (supabase as any)
      .from("pmc_regional_pins")
      .select(
        "id, country, region_group, label, latitude, longitude, map_zoom, pin_color, logo_url, visible, sort_order, description"
      );

    if (error || !data) {
      return mergePmcPinDefaults([]);
    }

    return mergePmcPinDefaults((data as PmcPinRow[]).map(rowToPartial));
  } catch {
    return mergePmcPinDefaults([]);
  }
}

export async function getPmcRegionalPin(
  id: string
): Promise<PmcRegionalPin | null> {
  const pins = await listPmcRegionalPins();
  return pins.find((pin) => pin.id === id) ?? null;
}

export type PmcRegionalPinUpdate = {
  id: string;
  label?: string;
  latitude?: number;
  longitude?: number;
  mapZoom?: number;
  pinColor?: string;
  logoUrl?: string;
  visible?: boolean;
  sortOrder?: number;
  description?: string;
};

export async function upsertPmcRegionalPin(
  update: PmcRegionalPinUpdate
): Promise<{ ok: true; pin: PmcRegionalPin } | { ok: false; error: string }> {
  const base =
    PMC_DEFAULT_REGIONAL_PINS.find((pin) => pin.id === update.id) ?? null;
  if (!base) {
    return { ok: false, error: "Unknown PMC pin id." };
  }

  const next: PmcRegionalPin = {
    ...base,
    label: update.label?.trim() || base.label,
    latitude:
      typeof update.latitude === "number" ? update.latitude : base.latitude,
    longitude:
      typeof update.longitude === "number" ? update.longitude : base.longitude,
    mapZoom:
      typeof update.mapZoom === "number" ? update.mapZoom : base.mapZoom,
    pinColor: update.pinColor?.trim() || base.pinColor,
    logoUrl: update.logoUrl?.trim() || base.logoUrl,
    visible: update.visible ?? base.visible,
    sortOrder:
      typeof update.sortOrder === "number" ? update.sortOrder : base.sortOrder,
    description: update.description?.trim() || base.description,
  };

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await (supabase as any).from("pmc_regional_pins").upsert(
      {
        id: next.id,
        country: next.country,
        region_group: next.regionGroup,
        label: next.label,
        latitude: next.latitude,
        longitude: next.longitude,
        map_zoom: next.mapZoom,
        pin_color: next.pinColor,
        logo_url: next.logoUrl,
        visible: next.visible,
        sort_order: next.sortOrder,
        description: next.description,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, pin: next };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to save pin.",
    };
  }
}

export async function upsertPmcRegionalPins(
  updates: PmcRegionalPinUpdate[]
): Promise<{ ok: true; pins: PmcRegionalPin[] } | { ok: false; error: string }> {
  const saved: PmcRegionalPin[] = [];
  for (const update of updates) {
    const result = await upsertPmcRegionalPin(update);
    if (!result.ok) return result;
    saved.push(result.pin);
  }
  return { ok: true, pins: await listPmcRegionalPins() };
}
