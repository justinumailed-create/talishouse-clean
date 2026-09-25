import { ALLPINS_FAST_CODE } from "@/lib/talispros/allpins-mapsite-constants";
import {
  MAPSITE_APP_PATH,
  buildClaimedMapSitePath,
  mapsiteBackFromScheduleHref,
} from "@/lib/talispros/mapsite-state";
import type { TalisBooksViewerBook } from "./types";

/** Google Maps pin for the Mapsite™ location, or a search from the book address. */
export function viewerGoogleMapsHref(
  book: Pick<TalisBooksViewerBook, "title" | "subtitle" | "pages">,
): string | null {
  for (const page of book.pages) {
    if (
      typeof page.latitude === "number" &&
      Number.isFinite(page.latitude) &&
      typeof page.longitude === "number" &&
      Number.isFinite(page.longitude)
    ) {
      return `https://www.google.com/maps/search/?api=1&query=${page.latitude},${page.longitude}`;
    }
  }
  const query = book.subtitle?.trim() || book.title?.trim() || "";
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function viewerFastCodeLabel(fastCode?: string | null): string | null {
  const code = fastCode?.trim().toUpperCase() || "";
  return code || null;
}

/**
 * FAST Code used for Mapsite™ navigation from a viewer book.
 * Isolated-shelf books are stored under the admin creator code (ADMIN123)
 * but belong to the ALLPINS showcase Mapsite™.
 */
export function viewerMapsiteFastCode(
  book: Pick<TalisBooksViewerBook, "fastCode" | "isolatedBookshelf">,
): string | null {
  if (book.isolatedBookshelf) return ALLPINS_FAST_CODE;
  const code = book.fastCode?.trim().toLowerCase() || "";
  return code || null;
}

/** Logo on the viewer rail opens this Mapsite™. */
export function viewerMapsiteHref(
  book: Pick<
    TalisBooksViewerBook,
    "fastCode" | "accountType" | "isolatedBookshelf"
  >,
): string {
  const code = viewerMapsiteFastCode(book);
  if (!code || code === "demo") return MAPSITE_APP_PATH;
  return buildClaimedMapSitePath({
    fastCode: code,
    accountType: book.isolatedBookshelf ? "listings" : book.accountType,
  });
}

/**
 * "Back to Mapsite™" from the book viewer.
 * Lands on listings/{code}; isolated shelf books use ALLPINS, not admin123.
 */
export function viewerBackToMapsiteHref(
  book: Pick<TalisBooksViewerBook, "fastCode" | "isolatedBookshelf">,
): string {
  return mapsiteBackFromScheduleHref(viewerMapsiteFastCode(book));
}
