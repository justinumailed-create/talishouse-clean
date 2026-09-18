import { isDemoMapSiteCode } from "@/lib/talispros/demo-mapsite";
import { isIssuedFastCode } from "@/lib/talispros/fast-code-shape";
import {
  isDemonstrationCatalogBook,
  isDemonstrationFastCode,
  type DemonstrationCatalogBookLike,
} from "./demonstration-catalog";

export type TalisBooksAdminLibraryScope = {
  /** Issued Mapsite™ FAST Code for the signed-in operator, when they have one. */
  fastCode: string | null;
  /** Drop pinned samples, demo-* FAST codes, and hardcoded preview fillers. */
  excludeDemonstrationCatalog: boolean;
};

/**
 * Mapsite-linked admins (rm22) see only that FAST Code's created books.
 * Platform-only admins (ARUN, ADMIN123) see every real (non-demo) book.
 * Anonymous / no admin session loads the created FAST-linked catalog
 * (no in-memory Meat Cove / preview shelf).
 */
export function talisbooksScopeFromAdminAccount(
  account: { fastCode: string } | null | undefined,
): TalisBooksAdminLibraryScope {
  const raw = account?.fastCode?.trim() || "";
  if (!raw) {
    return { fastCode: null, excludeDemonstrationCatalog: true };
  }

  const code = raw.toLowerCase();
  if (isIssuedFastCode(code) && !isDemoMapSiteCode(code)) {
    return { fastCode: code, excludeDemonstrationCatalog: true };
  }

  return { fastCode: null, excludeDemonstrationCatalog: true };
}

export function filterBooksForAdminLibrary<T extends DemonstrationCatalogBookLike>(
  books: T[],
  scope: TalisBooksAdminLibraryScope,
): T[] {
  return books.filter((book) => {
    if (scope.excludeDemonstrationCatalog && isDemonstrationCatalogBook(book)) {
      return false;
    }
    if (!scope.fastCode) return true;
    const bookCode = book.fastCode?.trim().toLowerCase() || "";
    return bookCode === scope.fastCode;
  });
}

export function filterMapSitesForAdminLibrary<T extends { fastCode: string }>(
  mapsites: T[],
  scope: TalisBooksAdminLibraryScope,
): T[] {
  return mapsites.filter((mapsite) => {
    const code = mapsite.fastCode?.trim() || "";
    if (!code) return false;
    if (scope.excludeDemonstrationCatalog && isDemonstrationFastCode(code)) {
      return false;
    }
    if (scope.fastCode && code.toLowerCase() !== scope.fastCode) {
      return false;
    }
    return true;
  });
}

/**
 * FAST-scope check for library deletes. Authentication is enforced separately
 * so anonymous visitors cannot use the same unscoped catalog view to delete.
 */
export function canAdminDeleteLibraryBook(
  book: DemonstrationCatalogBookLike,
  scope: TalisBooksAdminLibraryScope,
): boolean {
  if (scope.excludeDemonstrationCatalog && isDemonstrationCatalogBook(book)) {
    return false;
  }
  if (!scope.fastCode) return true;
  const bookCode = book.fastCode?.trim().toLowerCase() || "";
  return bookCode === scope.fastCode;
}
