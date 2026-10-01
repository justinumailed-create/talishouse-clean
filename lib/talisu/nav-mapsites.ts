/**
 * Nav Mapsites™ lists for the blue TalisUMktsHeader dropdown.
 * Claimed = non-demo Mapsites™ (admin-style inventory); Demo = is_demonstration.
 */
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { isDemoMapSiteCode, DEMO_MAPSITE_BUILD_PATH } from "@/lib/talispros/demo-mapsite";
import {
  buildClaimedMapSitePath,
  MAPSITE_APP_PATH,
} from "@/lib/talispros/mapsite-state";
import { isIssuedFastCode } from "@/lib/talispros/fast-code-shape";

export type NavMapSiteLink = {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  fastCode: string;
};

export type NavMapSitesPayload = {
  claimed: NavMapSiteLink[];
  demos: NavMapSiteLink[];
  /** Builder entry for new demonstration pins. */
  newDemoHref: string;
};

function displayLabel(
  title: string | null | undefined,
  address: string | null | undefined,
  fastCode: string,
): string {
  const t = title?.trim();
  if (t) return t;
  const a = address?.trim();
  if (a) return a;
  return fastCode.toUpperCase() || "Mapsite™";
}

export async function listNavMapSites(): Promise<NavMapSitesPayload> {
  const empty: NavMapSitesPayload = {
    claimed: [],
    demos: [],
    newDemoHref: DEMO_MAPSITE_BUILD_PATH,
  };
  if (!isSupabaseAdminConfigured()) return empty;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("mapsites")
    .select(
      "id, fast_code, property_title, property_address, account_type, is_demonstration, status, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) {
    console.error("[talisu] listNavMapSites:", error?.message);
    return empty;
  }

  const claimed: NavMapSiteLink[] = [];
  const demos: NavMapSiteLink[] = [];

  for (const row of data) {
    const id = (row.id || "").trim();
    const fastCode = (row.fast_code || "").trim();
    if (!id) continue;

    const isDemo =
      Boolean(row.is_demonstration) || isDemoMapSiteCode(fastCode);
    const label = displayLabel(
      row.property_title,
      row.property_address,
      fastCode || id.slice(0, 8),
    );

    if (isDemo) {
      demos.push({
        id,
        label,
        sublabel: [fastCode || "demo", row.status].filter(Boolean).join(" · "),
        href: `${MAPSITE_APP_PATH}?view=pin&mapsiteId=${encodeURIComponent(id)}`,
        fastCode: fastCode || "demo",
      });
      continue;
    }

    if (!fastCode || !isIssuedFastCode(fastCode)) continue;

    claimed.push({
      id,
      label,
      sublabel: [fastCode.toUpperCase(), row.status].filter(Boolean).join(" · "),
      href: buildClaimedMapSitePath({
        fastCode,
        accountType: row.account_type || "listings",
      }),
      fastCode,
    });
  }

  claimed.sort((a, b) =>
    a.fastCode.localeCompare(b.fastCode, undefined, { sensitivity: "base" }),
  );

  return { claimed, demos, newDemoHref: DEMO_MAPSITE_BUILD_PATH };
}
