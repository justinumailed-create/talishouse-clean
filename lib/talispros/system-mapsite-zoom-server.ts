import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { systemMapsiteOpeningZoom } from "@/lib/talispros/system-mapsite-zoom";

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

/**
 * `map_zoom_explicit` was added in migration 120. Until that migration is
 * applied, selecting it errors. Probe with one row instead of downloading the
 * PostgREST OpenAPI document (that download sat on every cold Mapsite render).
 * A missing column stays cached for 10 minutes; a present column stays cached
 * for the life of the isolate.
 */
let explicitColumn: { value: boolean; at: number } | null = null;
let explicitProbe: Promise<boolean> | null = null;
const MISSING_COLUMN_TTL_MS = 10 * 60_000;

function columnIsMissing(message: string | undefined): boolean {
  return /map_zoom_explicit|schema cache|does not exist|column/i.test(message || "");
}

async function explicitColumnReady(): Promise<boolean> {
  if (explicitColumn?.value) return true;
  if (explicitColumn && Date.now() - explicitColumn.at < MISSING_COLUMN_TTL_MS) return false;
  if (!isSupabaseAdminConfigured()) {
    explicitColumn = { value: false, at: Date.now() };
    return false;
  }
  if (!explicitProbe) {
    explicitProbe = (async () => {
      const { error } = await db().from("mapsites").select("map_zoom_explicit").limit(1);
      const ready = !error;
      if (error && !columnIsMissing(error.message)) {
        explicitColumn = { value: false, at: Date.now() - MISSING_COLUMN_TTL_MS + 15_000 };
        return false;
      }
      explicitColumn = { value: ready, at: Date.now() };
      return ready;
    })().finally(() => {
      explicitProbe = null;
    });
  }
  return explicitProbe;
}

/** True only after an editor save wrote the flag. Missing column means false. */
export async function readMapZoomExplicit(mapsiteId: string | null | undefined): Promise<boolean> {
  if (!mapsiteId || !(await explicitColumnReady())) return false;
  const { data, error } = await db()
    .from("mapsites")
    .select("map_zoom_explicit")
    .eq("id", mapsiteId)
    .maybeSingle();
  if (error || !data) return false;
  return (data as { map_zoom_explicit?: boolean | null }).map_zoom_explicit === true;
}

/** Mark the stored zoom as chosen by an editor. No-op until the column exists. */
export async function markMapZoomExplicit(mapsiteId: string): Promise<void> {
  if (!isSupabaseAdminConfigured() || !(await explicitColumnReady())) return;
  const { error } = await db()
    .from("mapsites")
    .update({ map_zoom_explicit: true })
    .eq("id", mapsiteId);
  if (error) {
    console.warn("[mapsite-zoom] Could not mark an editor zoom:", error.message);
  }
}

/**
 * Persist the 80 km opening zoom on a Mapsite that an editor has not overridden.
 * Used by the daily FAST Code job for a code that already has a Mapsite.
 */
export async function saveSystemMapsiteOpeningZoom(
  fastCode: string,
  latitude: number,
): Promise<void> {
  if (!isSupabaseAdminConfigured() || !Number.isFinite(latitude)) return;
  const code = fastCode.trim();
  if (!code) return;
  const client = db();
  const { data } = await client
    .from("mapsites")
    .select("id")
    .ilike("fast_code", code)
    .limit(1)
    .maybeSingle();
  const id = (data as { id?: string } | null)?.id;
  if (!id || (await readMapZoomExplicit(id))) return;
  const { error } = await client
    .from("mapsites")
    .update({ map_zoom: systemMapsiteOpeningZoom(latitude) })
    .eq("id", id);
  if (error) console.warn("[mapsite-zoom] Could not save opening zoom:", error.message);
}
