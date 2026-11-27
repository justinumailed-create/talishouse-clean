import type { MapEnginePin } from "./types";

/**
 * Duplicate / stacked PIN detection (Ralf, Nov 27 item #6).
 *
 * PINs that share the same spot (identical coordinates, or within a tight
 * tolerance) used to hide each other. They are grouped here so the map can
 * draw one marker with a white halo and a count badge, and a click can list
 * every PIN in that stack.
 */

/** Two PINs closer than this are treated as the same spot. */
export const PIN_STACK_TOLERANCE_METERS = 12;

const EARTH_RADIUS_M = 6_371_000;

export type PinStack = {
  /** Id of the PIN that represents the stack on the map (first in order). */
  leaderId: string;
  /** Every PIN id in this stack, leader first. */
  pinIds: string[];
  latitude: number;
  longitude: number;
};

/** Great-circle distance in metres. */
export function pinDistanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Group PINs that sit on the same spot. Only groups of two or more are
 * returned. Order follows the input, so the main (featured) PIN leads when
 * it is listed first.
 */
export function findPinStacks(
  pins: ReadonlyArray<Pick<MapEnginePin, "id" | "latitude" | "longitude">>,
  toleranceMeters = PIN_STACK_TOLERANCE_METERS,
): PinStack[] {
  const stacks: PinStack[] = [];
  const valid = pins.filter(
    (pin) => Number.isFinite(pin.latitude) && Number.isFinite(pin.longitude),
  );
  const assigned = new Set<string>();
  for (const pin of valid) {
    if (assigned.has(pin.id)) continue;
    const members = [pin.id];
    for (const other of valid) {
      if (other.id === pin.id || assigned.has(other.id) || members.includes(other.id)) continue;
      if (pinDistanceMeters(pin, other) <= toleranceMeters) members.push(other.id);
    }
    if (members.length > 1) {
      members.forEach((id) => assigned.add(id));
      stacks.push({
        leaderId: pin.id,
        pinIds: members,
        latitude: pin.latitude,
        longitude: pin.longitude,
      });
    }
  }
  return stacks;
}

/**
 * Collapse each stack into its leader marker, tagged with `stackCount` and
 * `stackPinIds` metadata (white halo + count badge). Non-leader PINs are
 * removed so they cannot hide under the leader and swallow clicks.
 * When `collapse` is false (owner is moving PINs) every PIN stays on the map
 * so each one can be dragged out of the stack, but the halo still shows.
 */
export function applyPinStacks<T extends MapEnginePin>(
  pins: ReadonlyArray<T>,
  options: { collapse?: boolean; toleranceMeters?: number } = {},
): { pins: T[]; stacks: PinStack[] } {
  const collapse = options.collapse ?? true;
  const stacks = findPinStacks(pins, options.toleranceMeters);
  if (stacks.length === 0) return { pins: [...pins], stacks };
  const byMember = new Map<string, PinStack>();
  for (const stack of stacks) for (const id of stack.pinIds) byMember.set(id, stack);
  const out: T[] = [];
  for (const pin of pins) {
    const stack = byMember.get(pin.id);
    if (!stack) {
      out.push(pin);
      continue;
    }
    const isLeader = stack.leaderId === pin.id;
    if (collapse && !isLeader) continue;
    out.push({
      ...pin,
      metadata: {
        ...(pin.metadata ?? {}),
        stackCount: stack.pinIds.length,
        stackPinIds: stack.pinIds,
        stackLeader: isLeader,
      },
    });
  }
  return { pins: out, stacks };
}

/** Stack for a PIN id (leader or member), if that PIN shares its spot. */
export function stackForPin(
  stacks: ReadonlyArray<PinStack>,
  pinId: string | null | undefined,
): PinStack | null {
  if (!pinId) return null;
  return stacks.find((stack) => stack.pinIds.includes(pinId)) ?? null;
}

/** Stack count from marker metadata (0 when the PIN is not stacked). */
export function readPinStackCount(pin: Pick<MapEnginePin, "metadata">): number {
  const value = pin.metadata?.stackCount;
  return typeof value === "number" && Number.isFinite(value) && value > 1
    ? Math.floor(value)
    : 0;
}

/**
 * Wrap a rendered marker body with a crisp white halo and a count badge.
 * Inline styles so the halo never depends on a stylesheet loading.
 */
export function decorateStackedPinHtml(html: string, count: number): string {
  if (count < 2) return html;
  const halo =
    "box-shadow:0 0 0 3px #ffffff,0 0 0 4px rgba(0,0,0,0.18),0 0 12px 4px rgba(255,255,255,0.85);border-radius:9999px;position:relative;";
  const badge = `<span class="talismaps-pin-stack-count" data-stack-count="${count}" aria-label="${count} PINs here" style="position:absolute;top:-8px;right:-10px;z-index:3;min-width:20px;height:20px;padding:0 5px;border-radius:9999px;background:#ffffff;color:#111111;font:700 12px/20px system-ui,-apple-system,sans-serif;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.35);pointer-events:none">${count}</span>`;
  const marker = '<div class="talismaps-pin-body" style="';
  if (!html.includes(marker)) return html;
  const withHalo = html.replace(marker, `${marker}${halo}`);
  // Badge goes inside the body so it sits at the body's top-right corner.
  const bodyStart = withHalo.indexOf(marker);
  const bodyOpenEnd = withHalo.indexOf(">", bodyStart);
  return `${withHalo.slice(0, bodyOpenEnd + 1)}${badge}${withHalo.slice(bodyOpenEnd + 1)}`;
}
