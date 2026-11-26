/**
 * Shared Flag message layout so URL, TEB™, TVA, and TTV render with the
 * same number of lines on the Mapsite PIN card (all four account levels).
 */
export const FLAG_MESSAGE_LINE_COUNT = 3;
export const FLAG_MESSAGE_WRAP_CHARS = 36;

/** Tailwind width: 36ch of text plus px-4 padding, capped to the viewport. */
export const FLAG_MESSAGE_POPOVER_WIDTH_CLASS =
  "w-[min(calc(36ch+2rem),calc(100vw-1rem))]";

export const FLAG_MESSAGE_TEXT_CLASS =
  "m-0 min-h-[3lh] text-[16px] leading-relaxed";

/** Ralf's Flag message copy (26 Nov 2026), used across all account levels. */
export const RALF_FLAG_MESSAGES = {
  url: "A link to an outside resource for this PIN, such as a website or listing page.",
  teb: "Digital lead magnets that attract prospects and differentiate in competitive markets.",
  tva: "A remote showing: up to ten rooms/scenes with you narrating a virtual walk-through.",
  ttv: "In-house online TV - Infomercials about Listings, green screen, you as host or co-host.",
} as const;

export function countWrappedLines(
  text: string,
  maxCharsPerLine = FLAG_MESSAGE_WRAP_CHARS,
): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  let lines = 1;
  let current = 0;
  for (const word of words) {
    const add = current === 0 ? word.length : current + 1 + word.length;
    if (add > maxCharsPerLine && current > 0) {
      lines += 1;
      current = word.length;
    } else {
      current = add;
    }
  }
  return lines;
}
