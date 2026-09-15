/**
 * Left featured pins for the public / root `/talisbooks/library` shelf.
 *
 * Edit `PUBLIC_LIBRARY_PINNED_BOOKS` to change which created FAST books appear
 * first on the left (hero, then the remaining featured slots). Order is
 * hero-first. Each entry prefers an exact book slug; if that slug is missing,
 * the first remaining book for that FAST code is used.
 *
 * Mapsite-scoped admin shelves (e.g. signed-in rm22) do not use this list.
 */

export type PublicLibraryPin = {
  fastCode: string;
  slug: string;
};

export const PUBLIC_LIBRARY_PINNED_BOOKS: readonly PublicLibraryPin[] = [
  { fastCode: "lg02", slug: "lg02-lg02-talisbook-4jmz" },
  { fastCode: "rm22", slug: "rm22-rm22-talisbook-b1mz" },
];

type PinnableBook = {
  id?: string | null;
  slug?: string | null;
  fastCode?: string | null;
  isPinned?: boolean;
  pinRank?: number;
};

function bookKey(book: PinnableBook): string {
  const id = book.id?.trim();
  if (id) return `id:${id}`;
  return `slug:${book.slug?.trim().toLowerCase() || ""}`;
}

function normalize(value: string | null | undefined): string {
  return value?.trim().toLowerCase() || "";
}

export function publicLibraryPinRank(book: PinnableBook): number | null {
  const slug = normalize(book.slug);
  const bySlug = PUBLIC_LIBRARY_PINNED_BOOKS.findIndex((pin) => pin.slug === slug);
  if (bySlug >= 0) return bySlug;
  return null;
}

export function applyPublicLibraryPins<T extends PinnableBook>(books: T[]): T[] {
  const ranks = new Map<string, number>();
  const claimedPins = new Set<number>();

  for (const [index, pin] of PUBLIC_LIBRARY_PINNED_BOOKS.entries()) {
    const match = books.find((book) => normalize(book.slug) === pin.slug);
    if (!match) continue;
    ranks.set(bookKey(match), index);
    claimedPins.add(index);
  }

  for (const [index, pin] of PUBLIC_LIBRARY_PINNED_BOOKS.entries()) {
    if (claimedPins.has(index)) continue;
    const match = books.find(
      (book) =>
        !ranks.has(bookKey(book)) && normalize(book.fastCode) === pin.fastCode,
    );
    if (!match) continue;
    ranks.set(bookKey(match), index);
    claimedPins.add(index);
  }

  return books.map((book) => {
    const rank = ranks.get(bookKey(book));
    if (rank == null) return book;
    return { ...book, isPinned: true, pinRank: rank };
  });
}
