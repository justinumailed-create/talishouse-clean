/** Google Places sourcing for the prospect review queue.
 * FAST Codes are NOT derived here — they come from decision-maker first+last initials after research/approval.
 */
import "server-only";
import {
  ANCHOR_TOWNS,
  BROKERAGES_PER_MARKET,
  MARKET_DIAMETER_KM,
  brokerageScore,
  isFranchiseName,
  looksLikeBrokerageOffice,
  websiteHost,
  type AnchorTown,
} from "@/lib/talispros/prospect-markets";

/** Server key for Places API (New). Same env vars the address search uses. */
export function googlePlacesKey(): { key: string; envName: string } | null {
  for (const envName of [
    "GOOGLE_PLACES_API_KEY",
    "GOOGLE_MAPS_API_KEY",
    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    "NEXT_PUBLIC_TALISMAPS_GOOGLE_MAPS_API_KEY",
  ]) {
    const key = process.env[envName]?.trim();
    if (key) return { key, envName };
  }
  return null;
}

/** Optional Programmable Search (Custom Search JSON API). */
export function googleCustomSearch(): { key: string; cx: string } | null {
  const key = process.env.GOOGLE_CSE_API_KEY?.trim() || process.env.GOOGLE_CUSTOM_SEARCH_API_KEY?.trim();
  const cx = process.env.GOOGLE_CSE_CX?.trim() || process.env.GOOGLE_CUSTOM_SEARCH_CX?.trim();
  return key && cx ? { key, cx } : null;
}

export interface PlaceCandidate {
  placeId: string;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  mapsUri: string;
  rating: number | null;
  ratingCount: number | null;
  lat: number | null;
  lng: number | null;
}

type PlacesResult =
  | { ok: true; places: Record<string, unknown>[] }
  | { ok: false; error: string };

const FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
  "places.location",
  "places.businessStatus",
  "places.types",
  "places.addressComponents",
].join(",");

async function textSearch(body: Record<string, unknown>, fields: string): Promise<PlacesResult> {
  const key = googlePlacesKey();
  if (!key) return { ok: false, error: "no Google Maps/Places key on the server" };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Goog-Api-Key": key.key,
        "X-Goog-FieldMask": fields,
        referer: "https://www.talispros.com/",
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as {
      places?: Record<string, unknown>[];
      error?: { status?: string; message?: string };
    };
    if (!res.ok) {
      const msg = (json.error?.message ?? "").replace(/AIza[0-9A-Za-z_-]+/g, "[key]").slice(0, 200);
      return { ok: false, error: `Google Places ${res.status} ${json.error?.status ?? ""}: ${msg}`.trim() };
    }
    return { ok: true, places: json.places ?? [] };
  } catch (e) {
    return { ok: false, error: `Google Places request failed: ${e instanceof Error ? e.name : "error"}` };
  } finally {
    clearTimeout(timer);
  }
}

/** Google's centre for the anchor town (falls back to the seed point). */
async function townCentre(t: AnchorTown): Promise<{ lat: number; lng: number; error?: string }> {
  const r = await textSearch(
    { textQuery: `${t.town}, ${t.province}, Canada`, regionCode: "CA", pageSize: 1 },
    "places.location",
  );
  if (!r.ok) return { lat: t.lat, lng: t.lng, error: r.error };
  const loc = r.places[0]?.location as { latitude?: number; longitude?: number } | undefined;
  return loc?.latitude && loc.longitude ? { lat: loc.latitude, lng: loc.longitude } : { lat: t.lat, lng: t.lng };
}

function box(lat: number, lng: number, km: number) {
  const dLat = km / 2 / 111;
  const dLng = km / 2 / (111 * Math.cos((lat * Math.PI) / 180));
  return { low: { latitude: lat - dLat, longitude: lng - dLng }, high: { latitude: lat + dLat, longitude: lng + dLng } };
}

function provinceOf(p: Record<string, unknown>): string | null {
  const comps = (p.addressComponents ?? []) as { shortText?: string; types?: string[] }[];
  return comps.find((c) => c.types?.includes("administrative_area_level_1"))?.shortText ?? null;
}

function hasStreetNumber(p: Record<string, unknown>): boolean {
  const comps = (p.addressComponents ?? []) as { types?: string[] }[];
  return comps.some((c) => c.types?.includes("street_number"));
}

export interface MarketSearchResult {
  market: string;
  candidates: (PlaceCandidate & { rank: number })[];
  skippedFranchise: number;
  skippedOther: number;
  error?: string;
}

/**
 * One market: Places Text Search for real-estate offices inside an 80 km box
 * around the anchor town, keep operating independent brokerage offices with a
 * street address in the same province, rank and return the top 3.
 */
export async function searchMarket(t: AnchorTown): Promise<MarketSearchResult> {
  const market = `${t.town}, ${t.province}`;
  const centre = await townCentre(t);
  if (centre.error) return { market, candidates: [], skippedFranchise: 0, skippedOther: 0, error: centre.error };
  const seen = new Map<string, Record<string, unknown>>();
  let error: string | undefined;
  for (const q of ["real estate brokerage", "independent real estate office", t.province === "QC" ? "agence immobilière" : "realty"]) {
    const r = await textSearch(
      {
        textQuery: `${q} near ${t.town}, ${t.province}`,
        regionCode: "CA",
        includedType: "real_estate_agency",
        strictTypeFiltering: true,
        pageSize: 20,
        locationRestriction: { rectangle: box(centre.lat, centre.lng, MARKET_DIAMETER_KM) },
      },
      FIELDS,
    );
    if (!r.ok) {
      error = r.error;
      break;
    }
    for (const p of r.places) if (typeof p.id === "string" && !seen.has(p.id)) seen.set(p.id, p);
  }
  let skippedFranchise = 0;
  let skippedOther = 0;
  const kept: PlaceCandidate[] = [];
  for (const p of seen.values()) {
    const name = ((p.displayName as { text?: string } | undefined)?.text ?? "").trim();
    const website = typeof p.websiteUri === "string" ? p.websiteUri : null;
    if (!name) continue;
    if (isFranchiseName(name, website)) {
      skippedFranchise++;
      continue;
    }
    if (
      p.businessStatus !== "OPERATIONAL" ||
      provinceOf(p) !== t.province ||
      !hasStreetNumber(p) ||
      !looksLikeBrokerageOffice(name) ||
      !website
    ) {
      skippedOther++;
      continue;
    }
    const loc = p.location as { latitude?: number; longitude?: number } | undefined;
    kept.push({
      placeId: p.id as string,
      name,
      address: String(p.formattedAddress ?? ""),
      phone: typeof p.nationalPhoneNumber === "string" ? p.nationalPhoneNumber : null,
      website,
      mapsUri: typeof p.googleMapsUri === "string" ? p.googleMapsUri : `https://www.google.com/maps/place/?q=place_id:${p.id}`,
      rating: typeof p.rating === "number" ? p.rating : null,
      ratingCount: typeof p.userRatingCount === "number" ? p.userRatingCount : null,
      lat: loc?.latitude ?? null,
      lng: loc?.longitude ?? null,
    });
  }
  // One office per website (branches of the same brokerage).
  const byHost = new Map<string, PlaceCandidate>();
  for (const c of kept.sort((a, b) => brokerageScore(b.rating, b.ratingCount) - brokerageScore(a.rating, a.ratingCount))) {
    const host = websiteHost(c.website) ?? c.placeId;
    if (!byHost.has(host)) byHost.set(host, c);
  }
  const candidates = [...byHost.values()].slice(0, BROKERAGES_PER_MARKET).map((c, i) => ({ ...c, rank: i + 1 }));
  return { market, candidates, skippedFranchise, skippedOther, error };
}

export { ANCHOR_TOWNS };
