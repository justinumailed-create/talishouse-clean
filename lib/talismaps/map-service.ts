import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/database.types";
import type {
  TalisMapsAccountType,
  TalisMapsActivityItem,
  TalisMapsDashboardData,
  TalisMapsDashboardStats,
  TalisMapsMap,
  TalisMapsVisitorTrendPoint,
} from "./types";

type MapRow = Database["public"]["Tables"]["talismaps_maps"]["Row"];
type PinRow = Database["public"]["Tables"]["talismaps_map_pins"]["Row"];
type AnalyticsRow = Database["public"]["Tables"]["talismaps_map_analytics"]["Row"];

function toTalisMapsMap(row: MapRow): TalisMapsMap {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    status: row.status as TalisMapsMap["status"],
    accountId: row.account_id,
    parentMapId: row.parent_map_id,
    mapsiteId: row.mapsite_id,
    fastCode: row.fast_code,
    accountType: row.account_type as TalisMapsMap["accountType"],
    defaultLatitude: row.default_latitude,
    defaultLongitude: row.default_longitude,
    defaultZoom: row.default_zoom,
    isPublic: row.is_public,
    settings: (row.settings as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatTrendLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function buildVisitorTrend(events: Pick<AnalyticsRow, "recorded_at">[]): TalisMapsVisitorTrendPoint[] {
  const counts = new Map<string, number>();

  for (const event of events) {
    const date = event.recorded_at.slice(0, 10);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  const sortedDates = [...counts.keys()].sort();
  const recentDates = sortedDates.slice(-7);

  if (recentDates.length === 0) {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const iso = date.toISOString().slice(0, 10);
      return {
        date: iso,
        label: formatTrendLabel(iso),
        count: 0,
      };
    });
  }

  return recentDates.map((date) => ({
    date,
    label: formatTrendLabel(date),
    count: counts.get(date) ?? 0,
  }));
}

function toMapActivity(row: MapRow): TalisMapsActivityItem {
  return {
    id: row.id,
    title: row.name,
    subtitle: row.slug,
    timestamp: row.updated_at,
    status: row.status,
    badge: row.account_type,
  };
}

function toPinActivity(
  pin: PinRow,
  mapName: string | undefined
): TalisMapsActivityItem {
  return {
    id: pin.id,
    title: pin.name,
    subtitle: mapName ? `${mapName} · ${pin.pin_type}` : pin.pin_type,
    timestamp: pin.updated_at,
    badge: pin.featured ? "featured" : pin.pin_type,
  };
}

function toImportActivity(row: AnalyticsRow, mapName: string | undefined): TalisMapsActivityItem {
  const metadata = (row.metadata as Record<string, unknown>) ?? {};
  const source = typeof metadata.source === "string" ? metadata.source : "import";
  const label = typeof metadata.label === "string" ? metadata.label : mapName ?? "Map import";

  return {
    id: row.id,
    title: label,
    subtitle: source,
    timestamp: row.recorded_at,
    badge: "import",
  };
}

export function mapsiteTalisMapSlug(fastCode: string): string {
  const code = fastCode.trim().toLowerCase();
  return code ? `mapsite-${code}` : "mapsite";
}

function talismapsAccountType(value: string | null | undefined): TalisMapsAccountType {
  const normalized = value?.trim().toLowerCase() || "";
  if (normalized === "derivative" || normalized.startsWith("derivative")) {
    return "derivative";
  }
  if (normalized.startsWith("adpro")) return "adpro";
  return "root";
}

export type EnsureMapSiteTalisMapInput = {
  mapsiteId: string;
  fastCode: string;
  name: string;
  description?: string | null;
  accountType?: string | null;
  latitude: number | null;
  longitude: number | null;
  zoom?: number | null;
  pinStyle?: Record<string, unknown>;
};

export type EnsureMapSiteTalisMapResult =
  | { ok: true; mapId: string; slug: string }
  | { ok: false; error: string };

/**
 * Create or update the Talismaps™ instance for an existing Mapsite™,
 * matching the Build My Mapsite™ home-PIN outcome.
 */
export async function ensureMapSiteTalisMap(
  input: EnsureMapSiteTalisMapInput,
): Promise<EnsureMapSiteTalisMapResult> {
  const mapsiteId = input.mapsiteId.trim();
  const fastCode = input.fastCode.trim().toLowerCase();
  if (!mapsiteId || !fastCode) {
    return { ok: false, error: "Mapsite™ ID and FAST Code are required." };
  }

  const supabase = getSupabaseAdmin();
  const slug = mapsiteTalisMapSlug(fastCode);
  const now = new Date().toISOString();
  const zoom =
    input.zoom != null && Number.isFinite(input.zoom)
      ? Math.min(21, Math.max(1, Math.round(input.zoom)))
      : 15;
  const name = input.name.trim() || `${fastCode.toUpperCase()} Mapsite™`;
  const description = input.description?.trim() || "";
  const accountType = talismapsAccountType(input.accountType);
  const settings = {
    source: "mapsite-admin",
    pinStyle: input.pinStyle ?? {},
  };

  const { data: existingByMapsite } = await supabase
    .from("talismaps_maps")
    .select("*")
    .eq("mapsite_id", mapsiteId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: existingBySlug } = existingByMapsite
    ? { data: null }
    : await supabase.from("talismaps_maps").select("*").eq("slug", slug).maybeSingle();

  const existing = existingByMapsite ?? existingBySlug;

  const payload = {
    slug,
    name,
    description,
    status: "published",
    mapsite_id: mapsiteId,
    fast_code: fastCode,
    account_type: accountType,
    default_latitude: input.latitude,
    default_longitude: input.longitude,
    default_zoom: zoom,
    is_public: true,
    settings,
    updated_at: now,
  };

  let mapId: string;
  if (existing) {
    const { data, error } = await supabase
      .from("talismaps_maps")
      .update(payload)
      .eq("id", existing.id)
      .select("id, slug")
      .single();
    if (error || !data) {
      return { ok: false, error: error?.message || "Could not update Talismaps™." };
    }
    mapId = data.id;
  } else {
    const { data, error } = await supabase
      .from("talismaps_maps")
      .insert(payload)
      .select("id, slug")
      .single();
    if (error || !data) {
      return { ok: false, error: error?.message || "Could not create Talismaps™." };
    }
    mapId = data.id;
  }

  if (
    input.latitude != null &&
    input.longitude != null &&
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude)
  ) {
    const { data: existingPin } = await supabase
      .from("talismaps_map_pins")
      .select("id")
      .eq("map_id", mapId)
      .eq("pin_type", "property")
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    const pinPatch = {
      name,
      description,
      latitude: input.latitude,
      longitude: input.longitude,
      featured: true,
      status: "published",
      visibility: "public",
      updated_at: now,
    };

    if (existingPin?.id) {
      await supabase.from("talismaps_map_pins").update(pinPatch).eq("id", existingPin.id);
    } else {
      await supabase.from("talismaps_map_pins").insert({
        map_id: mapId,
        pin_type: "property",
        ...pinPatch,
        sort_order: 0,
        metadata: input.pinStyle ?? {},
      });
    }
  }

  return { ok: true, mapId, slug };
}

export async function listTalisMaps(): Promise<TalisMapsMap[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("talismaps_maps")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[talismaps] listTalisMaps error:", error.message);
    return [];
  }

  return (data ?? []).map(toTalisMapsMap);
}

export async function getTalisMapsDashboardStats(): Promise<TalisMapsDashboardStats> {
  const data = await getTalisMapsDashboardData();
  return data.stats;
}

export async function getTalisMapsDashboardData(): Promise<TalisMapsDashboardData> {
  const supabase = getSupabaseAdmin();

  const [
    mapsResult,
    pinsResult,
    viewEventsResult,
    qrEventsResult,
    listingsResult,
    adproPinsResult,
    latestMapsResult,
    recentPinsResult,
    recentImportsResult,
    visitorTrendResult,
  ] = await Promise.all([
    supabase.from("talismaps_maps").select("id, status, account_type"),
    supabase.from("talismaps_map_pins").select("id", { count: "exact", head: true }),
    supabase
      .from("talismaps_map_analytics")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "view"),
    supabase
      .from("talismaps_map_analytics")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "qr_scan"),
    supabase
      .from("talismaps_map_pins")
      .select("id", { count: "exact", head: true })
      .eq("pin_type", "property"),
    supabase
      .from("talismaps_map_pins")
      .select("id", { count: "exact", head: true })
      .eq("pin_type", "adpro"),
    supabase
      .from("talismaps_maps")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("talismaps_map_pins")
      .select("*, talismaps_maps(name)")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("talismaps_map_analytics")
      .select("*, talismaps_maps(name)")
      .eq("event_type", "export")
      .order("recorded_at", { ascending: false })
      .limit(5),
    supabase
      .from("talismaps_map_analytics")
      .select("recorded_at")
      .eq("event_type", "view")
      .order("recorded_at", { ascending: false })
      .limit(200),
  ]);

  const maps = mapsResult.data ?? [];

  const stats: TalisMapsDashboardStats = {
    totalMaps: maps.length,
    totalPins: pinsResult.count ?? 0,
    publishedMaps: maps.filter((map) => map.status === "published").length,
    draftMaps: maps.filter((map) => map.status === "draft").length,
    visitors: viewEventsResult.count ?? 0,
    qrScans: qrEventsResult.count ?? 0,
    activeListings: listingsResult.count ?? 0,
    rootAccounts: maps.filter((map) => map.account_type === "root").length,
    derivativeAccounts: maps.filter((map) => map.account_type === "derivative").length,
    adproPins: adproPinsResult.count ?? 0,
  };

  const latestMaps = (latestMapsResult.data ?? []).map(toMapActivity);

  const recentPinUpdates = (recentPinsResult.data ?? []).map((row) => {
    const mapRelation = row.talismaps_maps as { name: string } | null;
    return toPinActivity(row as PinRow, mapRelation?.name);
  });

  const recentImports = (recentImportsResult.data ?? []).map((row) => {
    const mapRelation = row.talismaps_maps as { name: string } | null;
    return toImportActivity(row as AnalyticsRow, mapRelation?.name);
  });

  const visitorTrend = buildVisitorTrend(visitorTrendResult.data ?? []);

  return {
    stats,
    latestMaps,
    recentPinUpdates,
    recentImports,
    visitorTrend,
  };
}
