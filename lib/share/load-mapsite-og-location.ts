import { getMapSiteByFastCode } from "@/lib/mapsite-service";
import { getMapSiteLocationFromBuildRequest } from "@/lib/talispros/mapsite-platform";

export type MapsiteOgLocation = {
  latitude: number;
  longitude: number;
  zoom: number | null;
};

function finitePair(
  latitude: unknown,
  longitude: unknown,
): { latitude: number; longitude: number } | null {
  if (typeof latitude !== "number" || typeof longitude !== "number") return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

/**
 * Listing location for the share card. Build-request coordinates win, matching
 * the claimed Mapsite™ map, then the Mapsite™ row, then its first pin.
 * Missing coordinates stay null — demo fallback coords are not invented here.
 */
export async function loadMapsiteOgLocation(
  fastCode: string,
): Promise<MapsiteOgLocation | null> {
  const code = fastCode.trim();
  if (!code) return null;

  let mapsite: Awaited<ReturnType<typeof getMapSiteByFastCode>> = null;
  try {
    mapsite = await getMapSiteByFastCode(code);
  } catch (error) {
    console.warn(
      "[og] Mapsite™ lookup failed:",
      error instanceof Error ? error.message : error,
    );
  }

  let submissionLatitude: number | undefined;
  let submissionLongitude: number | undefined;
  try {
    const submission = await getMapSiteLocationFromBuildRequest({
      fastCode: code,
      mapsiteId: mapsite?.id,
    });
    submissionLatitude = submission?.latitude;
    submissionLongitude = submission?.longitude;
  } catch (error) {
    console.warn(
      "[og] Build request location failed:",
      error instanceof Error ? error.message : error,
    );
  }

  const fromSubmission = finitePair(submissionLatitude, submissionLongitude);
  if (fromSubmission) {
    return { ...fromSubmission, zoom: mapsite?.mapZoom ?? null };
  }

  const fromRow = finitePair(mapsite?.latitude, mapsite?.longitude);
  if (fromRow) return { ...fromRow, zoom: mapsite?.mapZoom ?? null };

  const pin = mapsite?.pins?.find((item) =>
    finitePair(item.latitude, item.longitude),
  );
  const fromPin = pin ? finitePair(pin.latitude, pin.longitude) : null;
  if (fromPin) return { ...fromPin, zoom: mapsite?.mapZoom ?? null };

  return null;
}
