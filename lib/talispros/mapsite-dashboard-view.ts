import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";

/** Missing or null stays on, which is how every Mapsite works today. */
export function mapsiteDashboardViewEnabled(value: boolean | null | undefined): boolean {
  return value !== false;
}

/**
 * The Mapsite's owner and a Mapsites admin may change the flag.
 * An agent session is neither.
 */
export function canChangeMapsiteDashboardView(input: {
  isMapsAdmin: boolean;
  isOwner: boolean;
}): boolean {
  return input.isMapsAdmin || input.isOwner;
}

export function isMissingDashboardViewColumn(message: string | null | undefined): boolean {
  const text = (message || "").toLowerCase();
  return text.includes("dashboard_view_enabled") && (text.includes("column") || text.includes("schema"));
}

/** Reads the flag. A database without migration 126 is treated as on. */
export async function readMapsiteDashboardViewEnabled(mapsiteId: string | null | undefined): Promise<boolean> {
  if (!mapsiteId || !isSupabaseAdminConfigured()) return true;
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await (
      supabase.from("mapsites") as unknown as {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => Promise<{
              data: { dashboard_view_enabled?: boolean | null } | null;
              error: { message: string } | null;
            }>;
          };
        };
      }
    )
      .select("dashboard_view_enabled")
      .eq("id", mapsiteId)
      .maybeSingle();
    if (error) {
      if (isMissingDashboardViewColumn(error.message)) return true;
      console.warn("[mapsite] dashboard view read failed:", error.message);
      return true;
    }
    const row = data as { dashboard_view_enabled?: boolean | null } | null;
    return mapsiteDashboardViewEnabled(row?.dashboard_view_enabled);
  } catch (error) {
    console.warn("[mapsite] dashboard view read failed:", error);
    return true;
  }
}
