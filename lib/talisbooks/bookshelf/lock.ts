/**
 * Locked right shelf on /catalogue/bookshelf: dummy covers behind a blur, a
 * Register CTA, and an "Already have a FAST Code?" field that opens that
 * code's connected bookshelf (/talisbooks/fast/{code}).
 */

/** Same-tab Register destination for locked shelves. */
export const BOOKSHELF_REGISTER_PATH = "/talisu/reg";

/** Locked right shelf: 4 rows × 10 dummy covers, no links. */
export const LOCKED_SHELF_ROWS = 4;
export const LOCKED_SHELF_COLUMNS = 10;
export const LOCKED_SHELF_DUMMY_COUNT = LOCKED_SHELF_ROWS * LOCKED_SHELF_COLUMNS;

/** Muted cloth-bound tones with a thin foil band — reads as real covers under the blur. */
const DUMMY_COVER_TONES = [
  ["#1f2937", "#374151"],
  ["#0c4a6e", "#0e7490"],
  ["#14532d", "#3f6212"],
  ["#7c2d12", "#9a3412"],
  ["#312e81", "#4338ca"],
  ["#3f3f46", "#71717a"],
  ["#78350f", "#b45309"],
  ["#134e4a", "#0f766e"],
  ["#4c0519", "#9f1239"],
  ["#1e3a5f", "#2563eb"],
] as const;

export function lockedShelfDummyCover(index: number): string {
  const [from, to] = DUMMY_COVER_TONES[index % DUMMY_COVER_TONES.length]!;
  const band = 58 + (index % 4) * 6;
  return [
    `linear-gradient(180deg, transparent 0 ${band}%, rgba(255,255,255,0.22) ${band}% ${band + 3}%, transparent ${band + 3}%)`,
    `linear-gradient(180deg, transparent 0 14%, rgba(255,255,255,0.12) 14% 15%, transparent 15%)`,
    `linear-gradient(160deg, ${from} 0%, ${to} 100%)`,
  ].join(", ");
}

export type BookshelfFastCodeInput =
  | { ok: true; code: string }
  | { ok: false; reason: "empty" | "format" };

/** Case-insensitive: trim, lower-case, strip slashes; letters, digits, hyphens only. */
export function normalizeBookshelfFastCodeInput(raw: unknown): BookshelfFastCodeInput {
  const code = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "");
  if (!code) return { ok: false, reason: "empty" };
  if (!/^[a-z0-9-]+$/.test(code) || code.length > 64) return { ok: false, reason: "format" };
  return { ok: true, code };
}

/** Per-FAST Code connected bookshelf route. */
export function connectedBookshelfPath(code: string): string {
  return `/talisbooks/fast/${encodeURIComponent(code.trim().toLowerCase())}`;
}

export type OpenConnectedBookshelfError = "empty" | "format" | "notFound" | "failed";

export type OpenConnectedBookshelfResult =
  | { success: true; href: string }
  | { success: false; error: OpenConnectedBookshelfError };
