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

export function hasValidCoordinates(
  latitude: string,
  longitude: string
): boolean {
  return isValidLatitude(latitude.trim()) && isValidLongitude(longitude.trim());
}
