import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/database.types";
import type {
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
