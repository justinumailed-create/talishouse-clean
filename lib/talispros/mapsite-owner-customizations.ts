/**
 * Owner Dashboard customizations (pure helpers — safe for client + server).
 *
 * Stored in `mapsite_owner_customizations` (migration 093):
 * - logo / partner photo overrides for the claimed Mapsite™ left card
 * - per-FAST-Code bookshelf order (ordered talisbooks_books ids)
 */

export type MapSiteOwnerCustomizations = {
  logoUrl: string | null;
  partnerImageUrl: string | null;
  bookshelfOrder: string[];
};

export type MapSiteBrandingField = "logo" | "partnerImage";

/** Dashboard dropdown items, in navbar order. */
export const MAPSITE_DASHBOARD_MENU_ITEMS = [
  { id: "ebooks", label: "Ebook Editor" },
  { id: "branding", label: "Logo & Image Editor" },
  { id: "pins", label: "PIN Dashboard" },
  { id: "bookshelf", label: "Bookshelf Editor" },
] as const;

export type MapSiteDashboardPanelId =
  (typeof MAPSITE_DASHBOARD_MENU_ITEMS)[number]["id"];

export const MAPSITE_BOOKSHELF_ORDER_MAX = 500;

export function emptyMapSiteOwnerCustomizations(): MapSiteOwnerCustomizations {
  return { logoUrl: null, partnerImageUrl: null, bookshelfOrder: [] };
}

/** Keep unique, non-empty string ids (bounded). */
export function normalizeBookshelfOrder(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const id = entry.trim();
    if (!id || seen.has(id) || id.length > 128) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= MAPSITE_BOOKSHELF_ORDER_MAX) break;
  }
  return ids;
}

/**
 * Apply a saved owner order. Books in `order` come first in that order;
 * books missing from the order (new books) keep their incoming order after them.
 */
export function applyBookshelfOrder<T extends { id: string }>(
  books: T[],
  order: readonly string[] | null | undefined,
): T[] {
  if (!order || order.length === 0) return books;
  const rank = new Map(order.map((id, index) => [id, index]));
  const ranked = books
    .map((book, index) => ({ book, index, rank: rank.get(book.id) }))
    .sort((a, b) => {
      const aRank = a.rank ?? Number.POSITIVE_INFINITY;
      const bRank = b.rank ?? Number.POSITIVE_INFINITY;
      if (aRank !== bRank) return aRank - bRank;
      return a.index - b.index;
    });
  return ranked.map((entry) => entry.book);
}

/** Move `activeId` to the slot of `overId` (insert), shifting the rest. */
export function insertBookAt(
  ids: readonly string[],
  activeId: string,
  overId: string,
): string[] {
  const from = ids.indexOf(activeId);
  const to = ids.indexOf(overId);
  if (from < 0 || to < 0 || from === to) return [...ids];
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}

/** Swap `activeId` with `overId` (drop one book onto another). */
export function swapBooks(
  ids: readonly string[],
  activeId: string,
  overId: string,
): string[] {
  const from = ids.indexOf(activeId);
  const to = ids.indexOf(overId);
  if (from < 0 || to < 0 || from === to) return [...ids];
  const next = [...ids];
  next[from] = ids[to]!;
  next[to] = ids[from]!;
  return next;
}

/** Move one step left (-1) or right (+1); used by keyboard / button controls. */
export function nudgeBook(
  ids: readonly string[],
  id: string,
  delta: -1 | 1,
): string[] {
  const from = ids.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= ids.length) return [...ids];
  return swapBooks(ids, id, ids[to]!);
}

/**
 * Owner-uploaded images must come from this project's public Supabase storage
 * (the existing optimize + upload route). Blocks arbitrary third-party URLs.
 */
export function isAllowedOwnerImageUrl(
  url: string | null | undefined,
  supabaseUrl: string | null | undefined,
): boolean {
  const value = url?.trim() || "";
  const base = supabaseUrl?.trim().replace(/\/$/, "") || "";
  if (!value || !base) return false;
  if (value.length > 2048) return false;
  return value.startsWith(`${base}/storage/v1/object/public/`);
}
