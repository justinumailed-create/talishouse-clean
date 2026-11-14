export type AishaBubbleSide = "left" | "right";

/**
 * One outline for the write-up: rounded card plus a tail on the bottom edge.
 * The tail is part of the path, so the fill and the stroke share it.
 */
export function aishaSpeechBubblePath(
  width: number,
  height: number,
  side: AishaBubbleSide,
): string {
  const w = Math.max(120, width);
  const h = Math.max(64, height);
  const r = 20;
  const tailH = 12;
  const tailW = 22;
  const bottom = h - tailH;
  const tipX =
    side === "right"
      ? Math.min(w - r - 16, Math.max(r + tailW, w - 76))
      : Math.max(r + 16, Math.min(w - r - tailW, 76));
  const leftBase = tipX - tailW / 2;
  const rightBase = tipX + tailW / 2;
  const tipY = h - 1;
  const n = (value: number) => Math.round(value * 10) / 10;

  return [
    `M ${n(r)} 1`,
    `H ${n(w - r)}`,
    `A ${r} ${r} 0 0 1 ${n(w - 1)} ${n(r)}`,
    `V ${n(bottom - r)}`,
    `A ${r} ${r} 0 0 1 ${n(w - r)} ${n(bottom)}`,
    `H ${n(rightBase)}`,
    `C ${n(rightBase - 3)} ${n(bottom)} ${n(tipX + 5)} ${n(tipY)} ${n(tipX)} ${n(tipY)}`,
    `C ${n(tipX - 5)} ${n(tipY)} ${n(leftBase + 3)} ${n(bottom)} ${n(leftBase)} ${n(bottom)}`,
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
): number {
  const w = Math.max(120, width);
  const r = 20;
  const tailW = 22;
  return side === "right"
    ? Math.min(w - r - 16, Math.max(r + tailW, w - 76))
    : Math.max(r + 16, Math.min(w - r - tailW, 76));
}
