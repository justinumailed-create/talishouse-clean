import type { TalisMapsPin } from "@/lib/talismaps";
import type { MapCoordinates } from "@/lib/talismaps/map-engine";

export const VISITOR_LOCATION_PIN_ID = "visitor-location";
export const VISITOR_LOCATION_SESSION_FLAG = "mapsite_visitor_location_prompted";
export const VISITOR_LOCATION_NOTICE_DISMISSED_FLAG =
  "mapsite_visitor_location_notice_dismissed";

export type VisitorLocationStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unsupported"
  | "unavailable";

export interface NearbyListing {
  pin: TalisMapsPin;
  /** Straight-line distance from the visitor in kilometers. */
  distanceFromVisitor: number;
  /** Rough driving-time estimate in minutes (future routing hook). */
  estimatedDrivingTime: number;
}

const EARTH_RADIUS_KM = 6371;
const AVERAGE_DRIVING_SPEED_KMH = 45;

export function haversineDistanceKm(
  from: MapCoordinates,
  to: MapCoordinates
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export function estimateDrivingTimeMinutes(distanceKm: number): number {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    return 0;
  }
  return Math.max(1, Math.round((distanceKm / AVERAGE_DRIVING_SPEED_KMH) * 60));
}

export function formatDistanceKm(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

export function formatDrivingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min drive`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours} hr ${remainder} min drive` : `${hours} hr drive`;
}

export function buildNearbyListings(
  pins: TalisMapsPin[],
  visitor: MapCoordinates
): NearbyListing[] {
  return pins
    .map((pin) => {
      const distanceFromVisitor = haversineDistanceKm(visitor, {
        latitude: pin.latitude,
        longitude: pin.longitude,
      });
      return {
        pin,
        distanceFromVisitor,
        estimatedDrivingTime: estimateDrivingTimeMinutes(distanceFromVisitor),
      };
    })
    .sort((left, right) => left.distanceFromVisitor - right.distanceFromVisitor);
}

export function hasAskedVisitorLocationThisSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(VISITOR_LOCATION_SESSION_FLAG) === "1";
  } catch {
    return false;
  }
}

export function markVisitorLocationPrompted(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(VISITOR_LOCATION_SESSION_FLAG, "1");
  } catch {
    // Session storage may be unavailable in strict privacy modes.
  }
}

export function hasDismissedVisitorLocationNotice(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.sessionStorage.getItem(VISITOR_LOCATION_NOTICE_DISMISSED_FLAG) === "1"
    );
  } catch {
    return false;
  }
}

export function markVisitorLocationNoticeDismissed(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(VISITOR_LOCATION_NOTICE_DISMISSED_FLAG, "1");
  } catch {
    // Session storage may be unavailable in strict privacy modes.
  }
}
