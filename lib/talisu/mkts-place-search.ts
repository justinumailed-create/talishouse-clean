/**
 * Atlist-parity place search helpers for /talisu/mkts:
 * haversine miles from a searched point → nearest PIN ranking + list labels.
 */

import { haversineDistanceKm } from "@/lib/mapsite/visitor-location";
import type { TalisUMktsPin, TalisUMktsPinKind } from "@/lib/talisu/markets-pins";

const KM_PER_MILE = 1.609344;

/** Default camera zoom after a place/postal search (town-scale). */
export const TALISU_MKTS_PLACE_SEARCH_ZOOM = 10;

export type MktsSearchOrigin = {
  latitude: number;
  longitude: number;
  /** Display string shown in the search field after a successful lookup. */
  label: string;
};

export type MktsDistanceResult = {
  pin: TalisUMktsPin;
  /** Straight-line distance in miles. */
  distanceMiles: number;
};

export function kmToMiles(km: number): number {
  return km / KM_PER_MILE;
}

export function haversineDistanceMiles(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  return kmToMiles(haversineDistanceKm(from, to));
}

/** Atlist-style one-decimal miles, e.g. "171.4 Miles". */
export function formatMilesDistance(miles: number): string {
  if (!Number.isFinite(miles) || miles < 0) return "0.0 Miles";
  return `${miles.toFixed(1)} Miles`;
}

/**
 * Sidebar row prefix for distance mode (matches Atlist):
 * market → "Canada {label}"; do-more → "Do More... {label}".
 */
export function formatMktsDistanceListLabel(
  pin: Pick<TalisUMktsPin, "kind" | "label">,
  opts: { canada: string; doMore: string },
): string {
  if (pin.kind === "do-more") {
    const prefix = opts.doMore.replace(/…/g, "...").replace(/\.\.\.$/, "...");
    return `${prefix} ${pin.label}`.trim();
  }
  return `${opts.canada} ${pin.label}`.trim();
}

/** Full Atlist row: "171.4 Miles • Canada Saskatchewan". */
export function formatMktsDistanceRow(
  miles: number,
  pin: Pick<TalisUMktsPin, "kind" | "label">,
  opts: { canada: string; doMore: string },
): string {
  return `${formatMilesDistance(miles)} • ${formatMktsDistanceListLabel(pin, opts)}`;
}

/**
 * Rank pins by straight-line distance from the searched origin (nearest first).
 * Includes market + Do More pins so Modular Spaces appears in the distance list.
 */
export function rankMktsPinsByDistance(
  pins: readonly TalisUMktsPin[],
  origin: { latitude: number; longitude: number },
  kinds?: readonly TalisUMktsPinKind[],
): MktsDistanceResult[] {
  const allowed = kinds ? new Set(kinds) : null;
  return pins
    .filter((pin) => (allowed ? allowed.has(pin.kind) : true))
    .map((pin) => ({
      pin,
      distanceMiles: haversineDistanceMiles(origin, {
        latitude: pin.latitude,
        longitude: pin.longitude,
      }),
    }))
    .sort((a, b) => {
      if (a.distanceMiles !== b.distanceMiles) {
        return a.distanceMiles - b.distanceMiles;
      }
      return a.pin.sortOrder - b.pin.sortOrder;
    });
}

export type MktsGeocodeResponse = {
  found?: boolean;
  latitude?: string | number;
  longitude?: string | number;
  address?: string | null;
};

/** Normalize /api/talismaps/geocode JSON into a search origin, or null. */
export function parseMktsGeocodePayload(
  payload: MktsGeocodeResponse,
  fallbackLabel: string,
): MktsSearchOrigin | null {
  if (!payload.found) return null;
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }
  const label = payload.address?.trim() || fallbackLabel.trim();
  if (!label) return null;
  return { latitude, longitude, label };
}
