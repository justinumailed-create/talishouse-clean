export interface ParsedCoordinates {
  latitude: string;
  longitude: string;
}

const COORDINATE_PAIR_PATTERN =
  /^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/;

export function parseCoordinatePaste(value: string): ParsedCoordinates | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(COORDINATE_PAIR_PATTERN);
  if (!match) return null;

  const latitude = match[1];
  const longitude = match[2];

  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

export function isValidLatitude(value: string): boolean {
  const num = Number.parseFloat(value);
  return Number.isFinite(num) && num >= -90 && num <= 90;
}

export function isValidLongitude(value: string): boolean {
  const num = Number.parseFloat(value);
  return Number.isFinite(num) && num >= -180 && num <= 180;
}

export function formatCoordinate(value: string): string {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return value;
  return String(num);
}

/**
 * Default zoom only when the user has not chosen a zoom yet.
 * Never force this on pin move — preserve the preview camera zoom.
 */
export const HOME_PIN_DEFAULT_MAP_ZOOM = 18;

export function clampMapZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return HOME_PIN_DEFAULT_MAP_ZOOM;
  return Math.min(21, Math.max(3, Math.round(zoom)));
}

export function hasValidCoordinates(
  latitude: string,
  longitude: string
): boolean {
  return isValidLatitude(latitude.trim()) && isValidLongitude(longitude.trim());
}
