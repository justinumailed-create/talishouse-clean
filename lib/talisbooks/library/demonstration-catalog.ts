/**
 * Demonstration / sample catalog markers for Talisbooks™ shelves.
 *
 * Demo Mapsites™ keep their own books; real FAST shelves (e.g. rm22) must not
 * inherit the pinned sample, demo-* rows, or hardcoded preview fillers.
 */

import { isDemoMapSiteCode } from "@/lib/talispros/demo-mapsite";
import { isIssuedFastCode } from "@/lib/talispros/fast-code-shape";
import { PINNED_TALISBOOK_SLUG } from "./pinned-catalog";

export const PINNED_TALISBOOK_LIBRARY_ID = "pinned-talispros-ebook-sample";

/** FAST codes used only by the in-memory preview bookshelf. */
export const DEMO_PREVIEW_FAST_CODES = ["talisroot", "talisderiv"] as const;

export type DemonstrationCatalogBookLike = {
  id?: string | null;
  slug?: string | null;
  title?: string | null;
  subtitle?: string | null;
  fastCode?: string | null;
  accountId?: string | null;
};

export function isDemonstrationFastCode(
  fastCode: string | null | undefined,
): boolean {
  const code = fastCode?.trim().toLowerCase() || "";
  if (!code) return false;
  if (code === "demo") return true;
  if ((DEMO_PREVIEW_FAST_CODES as readonly string[]).includes(code)) return true;
  return isDemoMapSiteCode(code);
}

export function isDemonstrationCatalogBook(
  book: DemonstrationCatalogBookLike,
): boolean {
  const id = book.id?.trim().toLowerCase() || "";
  const slug = book.slug?.trim().toLowerCase() || "";
  const accountId = book.accountId?.trim().toLowerCase() || "";

  if (id === PINNED_TALISBOOK_LIBRARY_ID) return true;
  if (id.startsWith("lib-demo-")) return true;
  if (slug === PINNED_TALISBOOK_SLUG) return true;
  if (accountId === "demo-root-account" || accountId === "demo-derivative-account") {
    return true;
  }
  if (isDemonstrationFastCode(book.fastCode)) return true;

  const title = book.title ?? "";
  const subtitle = book.subtitle ?? "";
  if (/demo mapsite/i.test(title) || /demo mapsite/i.test(subtitle)) return true;

  return false;
}

export function filterDemonstrationCatalogBooks<T extends DemonstrationCatalogBookLike>(
  books: T[],
): T[] {
  return books.filter((book) => !isDemonstrationCatalogBook(book));
}

/** Created books linked to a real issued FAST Code (not demo-* / preview fillers). */
export function isCreatedFastLinkedBook(
  book: Pick<DemonstrationCatalogBookLike, "fastCode">,
): boolean {
  const code = book.fastCode?.trim().toLowerCase() || "";
  return isIssuedFastCode(code) && !isDemonstrationFastCode(code);
}

export function filterCreatedFastLinkedBooks<T extends DemonstrationCatalogBookLike>(
  books: T[],
): T[] {
  return books.filter((book) => isCreatedFastLinkedBook(book) && !isDemonstrationCatalogBook(book));
}
