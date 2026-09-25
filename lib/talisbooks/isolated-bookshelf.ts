/**
 * Catalogue T-All isolated bookshelf.
 *
 * Separate from the public /talisbooks product shelf and from Mapsite™ TEB™
 * shelves. Only Global Admin creates books for it, through the self-serve
 * ebook generate flow. A linked Mapsite™ is optional — admin FAST Codes
 * such as ADMIN123 can create for this shelf without one.
 */

export const ISOLATED_BOOKSHELF_PATH = "/catalogue/bookshelf";
export const ISOLATED_BOOKSHELF_CREATE_PATH = "/catalogue/bookshelf/create";
export const ISOLATED_BOOKSHELF_DESTINATION = "isolated-bookshelf";
export const ISOLATED_BOOKSHELF_METADATA_KEY = "isolatedBookshelf";
export const ISOLATED_BOOKSHELF_UNLOCK_COOKIE = "catalogue_isolated_bookshelf";
/** Query flag set when the shelf is opened from the ALLPINS Mapsite™ chrome. */
export const ISOLATED_BOOKSHELF_FROM_PARAM = "from";
export const ISOLATED_BOOKSHELF_FROM_ALLPINS = "allpins";

export type IsolatedBookshelfDestination = typeof ISOLATED_BOOKSHELF_DESTINATION;

export function isIsolatedBookshelfDestination(
  value: string | null | undefined,
): value is IsolatedBookshelfDestination {
  return (value || "").trim().toLowerCase() === ISOLATED_BOOKSHELF_DESTINATION;
}

export function isIsolatedBookshelfBook(book: {
  metadata?: Record<string, unknown> | null;
}): boolean {
  const metadata = book.metadata ?? {};
  return metadata[ISOLATED_BOOKSHELF_METADATA_KEY] === true;
}

export function withIsolatedBookshelfMetadata(
  metadata: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ...metadata,
    [ISOLATED_BOOKSHELF_METADATA_KEY]: true,
    /** Never surface on the public /talisbooks product shelf. */
    globallyPublished: false,
  };
}

export function excludeIsolatedBookshelfBooks<
  T extends { metadata?: Record<string, unknown> | null },
>(books: T[]): T[] {
  return books.filter((book) => !isIsolatedBookshelfBook(book));
}

export function buildIsolatedBookshelfHref(options?: {
  fromAllPins?: boolean;
}): string {
  if (options?.fromAllPins) {
    return `${ISOLATED_BOOKSHELF_PATH}?${ISOLATED_BOOKSHELF_FROM_PARAM}=${ISOLATED_BOOKSHELF_FROM_ALLPINS}`;
  }
  return ISOLATED_BOOKSHELF_PATH;
}

export function isIsolatedBookshelfFromAllPins(
  value: string | null | undefined,
): boolean {
  return (value || "").trim().toLowerCase() === ISOLATED_BOOKSHELF_FROM_ALLPINS;
}

/**
 * Self-serve entry that lands on the isolated shelf after generate.
 * Catalogue chrome "Bookshelf" starts here so reaching the shelf follows
 * the self-serve ebook process.
 */
export function buildIsolatedBookshelfSelfServeHref(): string {
  return ISOLATED_BOOKSHELF_CREATE_PATH;
}

export function buildIsolatedBookshelfEbookChoiceHref(options?: {
  fastCode?: string | null;
  mapsiteId?: string | null;
  accountType?: string | null;
  requestId?: string | null;
}): string {
  const params = new URLSearchParams();
  params.set("destination", ISOLATED_BOOKSHELF_DESTINATION);
  if (options?.fastCode?.trim()) params.set("fastCode", options.fastCode.trim());
  if (options?.mapsiteId?.trim()) params.set("mapsiteId", options.mapsiteId.trim());
  if (options?.accountType?.trim()) {
    params.set("accountType", options.accountType.trim());
  }
  if (options?.requestId?.trim()) params.set("requestId", options.requestId.trim());
  return `/talispros/ebook-choice?${params.toString()}`;
}
