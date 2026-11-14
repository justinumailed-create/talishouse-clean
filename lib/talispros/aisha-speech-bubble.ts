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

/**
 * Place the write-up on the same left and right edges as the call pill.
 * The tail aims at the avatar when that center is known, otherwise the middle.
 */
export function aishaBubbleFrame(input: {
  pillLeft: number;
  pillTop: number;
  pillWidth: number;
  avatarCenter: number | null;
  viewportHeight: number;
}): { left: number; width: number; bottom: number; tip: number } {
  const left = Math.round(input.pillLeft);
  const width = Math.max(1, Math.round(input.pillWidth));
  const bottom = Math.max(0, Math.round(input.viewportHeight - input.pillTop));
  const raw =
    input.avatarCenter == null
      ? width / 2
      : input.avatarCenter - input.pillLeft;
  return {
    left,
    width,
    bottom,
    tip: aishaSpeechBubbleTipX(width, "left", raw),
  };
}
