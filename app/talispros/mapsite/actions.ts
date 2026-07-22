"use server";

import {
  createFallbackDemoMapSite,
  getDemonstrationMapSite,
  getMapSitePlatformByFastCode,
  getMapSitePlatformById,
  mergeMapSiteWithSubmittedLocation,
  type MapSitePlatformRecord,
} from "@/lib/talispros/mapsite-platform";

export async function loadMapSiteApplicationState(options?: {
  mapsiteId?: string | null;
  fastCode?: string | null;
  requestId?: string | null;
  claimed?: boolean;
}): Promise<MapSitePlatformRecord> {
  const mapsiteId = options?.mapsiteId?.trim() || null;
  const fastCode = options?.fastCode?.trim() || null;
  const requestId = options?.requestId?.trim() || null;
  const claimed = Boolean(options?.claimed);

  let mapsite: MapSitePlatformRecord | null = null;

  if (mapsiteId) {
    mapsite = await getMapSitePlatformById(mapsiteId);
  }

  if (!mapsite && fastCode) {
    mapsite = await getMapSitePlatformByFastCode(fastCode);
  }

  if (!mapsite) {
    mapsite = await getDemonstrationMapSite();
  }

  if (claimed) {
    mapsite = {
      ...mapsite,
      status:
        mapsite.status === "UNCLAIMED"
          ? "BUILD_REQUEST_SUBMITTED"
          : mapsite.status,
      fast_code: fastCode || mapsite.fast_code,
    };
  } else if (fastCode && !mapsite.fast_code) {
    mapsite = { ...mapsite, fast_code: fastCode };
  }

  if (claimed || mapsite.status !== "UNCLAIMED") {
    mapsite = await mergeMapSiteWithSubmittedLocation(mapsite, {
      requestId,
      fastCode: fastCode || mapsite.fast_code,
    });
  }

  return mapsite;
}

export async function refreshMapSiteApplicationState(
  mapsiteId: string
): Promise<MapSitePlatformRecord | null> {
  const mapsite = await getMapSitePlatformById(mapsiteId);
  if (!mapsite) return null;
  return mergeMapSiteWithSubmittedLocation(mapsite);
}
