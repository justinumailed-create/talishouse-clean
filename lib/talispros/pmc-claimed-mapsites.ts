import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";

export type PmcClaimedMapSiteListItem = {
  fastCode: string;
  status: string;
  propertyTitle: string | null;
  mapsiteId: string | null;
  assignedAt: string | null;
};

/**
 * All generated MapSite FAST Codes for PMC admin — sourced from `fast_codes`,
 * not only the current `mapsites.fast_code` value (claims can overwrite that).
 */
export async function listPmcClaimedMapSites(): Promise<PmcClaimedMapSiteListItem[]> {
  if (!isSupabaseAdminConfigured()) {
    return [];
  }

  try {
    const supabase = getSupabaseAdmin();

    const [{ data: codes, error: codesError }, { data: mapsites }] =
      await Promise.all([
        supabase
          .from("fast_codes")
          .select("code, type, mapsite_id, request_id, assigned_at, account_type")
          .order("assigned_at", { ascending: false }),
        supabase
          .from("mapsites")
          .select("id, fast_code, status, property_title"),
      ]);

    if (codesError || !codes) {
      console.warn("[pmc] Unable to list fast codes:", codesError?.message);
      return [];
    }

    const requestIds = [
      ...new Set(
        codes
          .map((row) => row.request_id)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    const buildById = new Map<
      string,
      { linked_mapsite_id: string | null; property_title: string | null }
    >();

    if (requestIds.length > 0) {
      const { data: builds } = await supabase
        .from("build_requests")
        .select(
          "id, linked_mapsite_id, first_name, last_name, street_address, future_pin_label, property_title"
        )
        .in("id", requestIds);

      for (const build of builds ?? []) {
        const name = [build.first_name, build.last_name]
          .filter(Boolean)
          .join(" ")
          .trim();
        const title =
          build.property_title?.trim() ||
          build.future_pin_label?.trim() ||
          (name ? `${name} MapSite™` : null) ||
          build.street_address?.trim() ||
          null;
        buildById.set(build.id, {
          linked_mapsite_id: build.linked_mapsite_id,
          property_title: title,
        });
      }
    }

    const mapsiteById = new Map((mapsites ?? []).map((row) => [row.id, row]));
    const mapsiteByCode = new Map(
      (mapsites ?? []).map((row) => [row.fast_code.trim().toLowerCase(), row])
    );

    const items: PmcClaimedMapSiteListItem[] = [];
    const seen = new Set<string>();

    for (const row of codes) {
      const code = row.code?.trim();
      if (!code) continue;
      const key = code.toLowerCase();
      if (key === "demo") continue;
      if (seen.has(key)) continue;
      seen.add(key);

      const build = row.request_id ? buildById.get(row.request_id) : null;
      const linkedId = row.mapsite_id ?? build?.linked_mapsite_id ?? null;
      const linked =
        (linkedId ? mapsiteById.get(linkedId) : null) ??
        mapsiteByCode.get(key) ??
        null;

      items.push({
        fastCode: code,
        status: linked?.status ?? row.account_type ?? row.type ?? "issued",
        propertyTitle:
          build?.property_title ?? linked?.property_title ?? null,
        mapsiteId: linked?.id ?? linkedId ?? null,
        assignedAt: row.assigned_at ?? null,
      });
    }

    // Include mapsites that have a FAST code but no fast_codes row yet.
    for (const row of mapsites ?? []) {
      const code = row.fast_code?.trim();
      if (!code) continue;
      const key = code.toLowerCase();
      if (key === "demo" || seen.has(key)) continue;
      seen.add(key);
      items.push({
        fastCode: code,
        status: row.status,
        propertyTitle: row.property_title,
        mapsiteId: row.id,
        assignedAt: null,
      });
    }

    return items;
  } catch (error) {
    console.warn("[pmc] listPmcClaimedMapSites failed:", error);
    return [];
  }
}
