export type AishaBubbleSide = "left" | "right";

/**
 * One outline for the write-up: rounded card plus a tail on the bottom edge.
 * The tail is part of the path, so the fill and the stroke share it.
 */
export function aishaSpeechBubblePath(
  width: number,
  height: number,
  side: AishaBubbleSide,
  tipX?: number | null,
): string {
  const w = Math.max(120, width);
  const h = Math.max(64, height);
  const r = 20;
  const tailH = 12;
  const tailW = 22;
  const bottom = h - tailH;
  const automatic =
    side === "right"
      ? Math.min(w - r - 16, Math.max(r + tailW, w - 76))
      : Math.max(r + 16, Math.min(w - r - tailW, 76));
  const aimed = tipX == null || !Number.isFinite(tipX) ? automatic : tipX;
  const minTip = r + tailW / 2 + 4;
  const maxTip = w - r - tailW / 2 - 4;
  const tip = Math.min(maxTip, Math.max(minTip, aimed));
  const leftBase = tip - tailW / 2;
  const rightBase = tip + tailW / 2;
  const tipY = h - 1;
  const n = (value: number) => Math.round(value * 10) / 10;

  return [
    `M ${n(r)} 1`,
    `H ${n(w - r)}`,
    `A ${r} ${r} 0 0 1 ${n(w - 1)} ${n(r)}`,
    `V ${n(bottom - r)}`,
    `A ${r} ${r} 0 0 1 ${n(w - r)} ${n(bottom)}`,
    `H ${n(rightBase)}`,
    `C ${n(rightBase - 3)} ${n(bottom)} ${n(tip + 5)} ${n(tipY)} ${n(tip)} ${n(tipY)}`,
    `C ${n(tip - 5)} ${n(tipY)} ${n(leftBase + 3)} ${n(bottom)} ${n(leftBase)} ${n(bottom)}`,
    `H ${n(r)}`,
    `A ${r} ${r} 0 0 1 1 ${n(bottom - r)}`,
    `V ${n(r)}`,
    `A ${r} ${r} 0 0 1 ${n(r)} 1`,
    "Z",
  ].join(" ");
}

/** The lowest point of the tail, used to aim it at the call bar. */
export function aishaSpeechBubbleTipX(
  width: number,
  side: AishaBubbleSide,
  tipX?: number | null,
): number {
  const w = Math.max(120, width);
  const r = 20;
  const tailW = 22;
  const automatic =
    side === "right"
      ? Math.min(w - r - 16, Math.max(r + tailW, w - 76))
      : Math.max(r + 16, Math.min(w - r - tailW, 76));
  const aimed = tipX == null || !Number.isFinite(tipX) ? automatic : tipX;
  const minTip = r + tailW / 2 + 4;
  const maxTip = w - r - tailW / 2 - 4;
  return Math.min(maxTip, Math.max(minTip, aimed));
}

/** Wide enough for the English and German greetings to sit on two lines. */
export const AISHA_BUBBLE_TARGET_WIDTH = 448;
/** Space kept between the bubble and the screen edge. */
export const AISHA_BUBBLE_SCREEN_GUTTER = 8;

/**
 * Place the write-up above the call pill, wider than the pill so the greeting
 * stays on two lines. The tail still aims at the avatar. A narrow screen
 * shrinks the bubble so it stays inside the viewport.
 */
export function aishaBubbleFrame(input: {
  pillLeft: number;
  pillTop: number;
  pillWidth: number;
  avatarCenter: number | null;
  viewportHeight: number;
  viewportWidth?: number;
}): { left: number; width: number; bottom: number; tip: number } {
  const gutter = AISHA_BUBBLE_SCREEN_GUTTER;
  const viewport = Math.max(1, Math.round(input.viewportWidth ?? 1440));
  const width = Math.max(
    1,
    Math.min(AISHA_BUBBLE_TARGET_WIDTH, viewport - gutter * 2),
  );
  let left = Math.round(input.pillLeft);
  if (left + width > viewport - gutter) left = viewport - gutter - width;
  if (left < gutter) left = gutter;
  const bottom = Math.max(0, Math.round(input.viewportHeight - input.pillTop));
  const anchor =
    input.avatarCenter == null
      ? input.pillLeft + input.pillWidth / 2
      : input.avatarCenter;
  return {
    left,
    width,
    bottom,
    tip: aishaSpeechBubbleTipX(width, "left", anchor - left),
  };
}
