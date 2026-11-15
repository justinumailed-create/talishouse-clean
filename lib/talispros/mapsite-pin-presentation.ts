import { cameraCenterForScreenOffset } from "@/lib/talismaps/map-engine/pin-focus-camera";

/** A blank owner pin this close to the geocoded address is the eBook pin. */
export const EBOOK_PIN_MAX_METERS = 400;

/** Pins closer than this share one spot at the opening zoom. */
export const CLOSE_PIN_METERS = 250;

/** Screen shift so a stacked pin stays clickable. */
export const CLOSE_PIN_NUDGE_PX = 96;

/** Zoom that puts a pin ~150 m away beside the card instead of under it. */
export const CLOSE_PAIR_FOCUS_ZOOM = 18;

export type PinPoint = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  category?: string | null;
};

export type PresentedPin = PinPoint & {
  role: "main" | "address" | "extra";
  screenNudgeX: number;
};

export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const lat = ((a.latitude + b.latitude) / 2) * (Math.PI / 180);
  const dLat = (b.latitude - a.latitude) * 111320;
  const dLng = (b.longitude - a.longitude) * 111320 * Math.cos(lat);
  return Math.hypot(dLat, dLng);
}

function blank(label: string | null | undefined): boolean {
  return !(label || "").replace(/\s+/g, " ").trim();
}

/**
 * The eBook is stored on the Mapsite, at the geocoded address. An owner
 * sometimes drops a second, unlabeled pin a short walk away for the property
 * the book is about. That pin is the main pin. The geocode stays as the
 * address pin.
 */
export function presentMapSitePins(input: {
  mapsiteId: string;
  latitude: number;
  longitude: number;
  mainLabel: string;
  addressLabel: string;
  hasEbook: boolean;
  blankLabel: string;
  additional: PinPoint[];
}): PresentedPin[] {
  const origin = { latitude: input.latitude, longitude: input.longitude };
  const blankNearby = input.hasEbook
    ? input.additional.filter(
        (pin) => blank(pin.label) && distanceMeters(origin, pin) <= EBOOK_PIN_MAX_METERS,
      )
    : [];
  const ebookPin = blankNearby.length === 1 ? blankNearby[0]! : null;

  const main: PresentedPin = {
    id: input.mapsiteId,
    latitude: ebookPin ? ebookPin.latitude : input.latitude,
    longitude: ebookPin ? ebookPin.longitude : input.longitude,
    label: input.mainLabel,
    role: "main",
    screenNudgeX: 0,
  };

  const extras: PresentedPin[] = [];
  if (ebookPin && distanceMeters(origin, ebookPin) > 30) {
    extras.push({
      id: `geocode:${input.mapsiteId}`,
      latitude: input.latitude,
      longitude: input.longitude,
      label: input.addressLabel,
      role: "address",
      screenNudgeX: 0,
    });
  }
  for (const pin of input.additional) {
    if (ebookPin && pin.id === ebookPin.id) continue;
    const label = blank(pin.label) ? input.blankLabel : pin.label.replace(/\s+/g, " ").trim();
    extras.push({
      id: pin.id,
      latitude: pin.latitude,
      longitude: pin.longitude,
      label,
      category: pin.category,
      role: "extra",
      screenNudgeX: 0,
    });
  }

  const pins = [main, ...extras];
  for (let i = 0; i < pins.length; i += 1) {
    const pin = pins[i]!;
    if (pin.screenNudgeX) continue;
    const partner = pins.find(
      (other, index) =>
        index < i && distanceMeters(pin, other) <= CLOSE_PIN_METERS && other.screenNudgeX === 0,
    );
    if (partner) pin.screenNudgeX = CLOSE_PIN_NUDGE_PX;
  }
  return pins;
}

export type FitPadding = { top: number; right: number; bottom: number; left: number };

/** Insets so pins stay out of the navbar, owner card, zoom rail, and Aisha. */
export function mapsitePinFitPadding(input: { width: number; compact: boolean }): FitPadding {
  if (input.compact || input.width < 900) {
    return { top: 112, right: 72, bottom: 320, left: 16 };
  }
  return { top: 96, right: 300, bottom: 320, left: 400 };
}

/** Shrink the insets when the map is shorter than the overlays stacked together. */
export function clampFitPadding(pad: FitPadding, width: number, height: number): FitPadding {
  const maxX = Math.max(48, width - 80);
  const maxY = Math.max(48, height - 80);
  const scaleX = pad.left + pad.right > maxX ? maxX / (pad.left + pad.right) : 1;
  const scaleY = pad.top + pad.bottom > maxY ? maxY / (pad.top + pad.bottom) : 1;
  const scale = Math.min(1, scaleX, scaleY);
  return {
    top: Math.round(pad.top * scale),
    right: Math.round(pad.right * scale),
    bottom: Math.round(pad.bottom * scale),
    left: Math.round(pad.left * scale),
  };
}

export function mapsitePinFitPaddingForViewport(input: {
  width: number;
  height: number;
  compact: boolean;
}): FitPadding {
  return clampFitPadding(mapsitePinFitPadding(input), input.width, input.height);
}

/**
 * Slide the camera a little so a nearby pin is not under an overlay.
 * The selected pin stays near the card tip: the shift is capped.
 */
export function shiftCameraForNeighbors(input: {
  camera: { latitude: number; longitude: number };
  zoom: number;
  neighbors: { latitude: number; longitude: number }[];
  width: number;
  height: number;
  padding: FitPadding;
}): { latitude: number; longitude: number } {
  let shiftX = 0;
  let shiftY = 0;
  const scale = 2 ** input.zoom;
  for (const neighbor of input.neighbors) {
    const dx = (mercatorX(neighbor.longitude) - mercatorX(input.camera.longitude)) * scale;
    const dy = (mercatorY(neighbor.latitude) - mercatorY(input.camera.latitude)) * scale;
    const x = input.width / 2 + dx;
    const y = input.height / 2 + dy;
    const minX = input.padding.left + 28;
    const maxX = input.width - input.padding.right - 28;
    const minY = input.padding.top + 28;
    const maxY = input.height - input.padding.bottom - 28;
    if (maxX <= minX || maxY <= minY) continue;
    if (x < minX) shiftX += minX - x;
    else if (x > maxX) shiftX += maxX - x;
    if (y < minY) shiftY += minY - y;
    else if (y > maxY) shiftY += maxY - y;
  }
  const cap = 120;
  shiftX = Math.max(-cap, Math.min(cap, shiftX));
  shiftY = Math.max(-cap, Math.min(cap, shiftY));
  if (shiftX === 0 && shiftY === 0) return input.camera;
  // Moving a pin right on screen means moving the camera left.
  return cameraCenterForScreenOffset(input.camera, input.zoom, { x: shiftX, y: shiftY });
}

function mercatorX(longitude: number): number {
  return ((longitude + 180) / 360) * 256;
}

function mercatorY(latitude: number): number {
  const siny = Math.min(Math.max(Math.sin((latitude * Math.PI) / 180), -0.9999), 0.9999);
  return (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)) * 256;
}
