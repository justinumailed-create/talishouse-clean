import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { systemMapsiteOpeningZoom } from "@/lib/talispros/system-mapsite-zoom";

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

/**
 * PostgREST OpenAPI lists columns that exist. Selecting a missing
 * `map_zoom_explicit` would be a query error, so the page checks the schema
 * first and treats a missing column as "not explicit".
 */
let explicitColumn: { value: boolean; at: number } | null = null;

async function explicitColumnReady(): Promise<boolean> {
  if (explicitColumn?.value) return true;
  if (explicitColumn && Date.now() - explicitColumn.at < 60_000) return false;
  if (!isSupabaseAdminConfigured()) {
    explicitColumn = { value: false, at: Date.now() };
    return false;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    explicitColumn = { value: false, at: Date.now() };
    return false;
  }
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/openapi+json",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      explicitColumn = { value: false, at: Date.now() };
      return false;
    }
    const spec = await response.text();
    const ready = spec.includes("map_zoom_explicit");
    explicitColumn = { value: ready, at: Date.now() };
    return ready;
  } catch {
    explicitColumn = { value: false, at: Date.now() };
    return false;
  }
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
