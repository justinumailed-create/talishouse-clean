import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { systemMapsiteOpeningZoom } from "@/lib/talispros/system-mapsite-zoom";

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

function missingColumn(error: { message?: string } | null): boolean {
  return /map_zoom_explicit|opening_zoom|schema cache|column/i.test(error?.message || "");
}

/** True only after an editor save wrote the flag. Missing column means not explicit. */
export async function readMapZoomExplicit(mapsiteId: string | null | undefined): Promise<boolean> {
  if (!mapsiteId || !isSupabaseAdminConfigured()) return false;
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
  if (!isSupabaseAdminConfigured()) return;
  const { error } = await db()
    .from("mapsites")
    .update({ map_zoom_explicit: true })
    .eq("id", mapsiteId);
  if (error && !missingColumn(error)) {
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
  if (!id) return;
  if (await readMapZoomExplicit(id)) return;
  const { error } = await client
    .from("mapsites")
    .update({ map_zoom: systemMapsiteOpeningZoom(latitude) })
    .eq("id", id);
  if (error) console.warn("[mapsite-zoom] Could not save opening zoom:", error.message);
}
