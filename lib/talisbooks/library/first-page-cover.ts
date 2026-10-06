/**
 * Shelf thumbnails: each book's first-page image is its cover thumbnail.
 * Falls back to the stored cover (metadata / cover_image_id), then to the
 * colour gradient only when the book has no page image.
 */
const FIRST_PAGE_IMAGE_KEYS = ["heroImageUrl", "spreadImageUrl", "imageUrl", "backgroundImageUrl"] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function firstPageImageFromContent(content: unknown): string | null {
  if (!content || typeof content !== "object" || Array.isArray(content)) return null;
  const record = content as Record<string, unknown>;
  for (const key of FIRST_PAGE_IMAGE_KEYS) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/** Pick the lowest-numbered page image per book. */
export function pickFirstPageImages(
  rows: Array<{ book_id: string; page_number: number; content: unknown }>,
): Map<string, string> {
  const best = new Map<string, { page: number; url: string }>();
  for (const row of rows) {
    const url = firstPageImageFromContent(row.content);
    if (!url) continue;
    const current = best.get(row.book_id);
    if (!current || row.page_number < current.page) {
      best.set(row.book_id, { page: row.page_number, url });
    }
  }
  return new Map([...best].map(([id, entry]) => [id, entry.url]));
}

/** First-page image wins; otherwise keep the existing cover (or null → gradient). */
export function applyFirstPageCovers<T extends { id: string; coverImageUrl: string | null }>(
  books: T[],
  firstPageImages: Map<string, string>,
): T[] {
  return books.map((book) => {
    const url = firstPageImages.get(book.id);
    return url && url !== book.coverImageUrl ? { ...book, coverImageUrl: url } : book;
  });
}

/** Server: load first-page images for real (uuid) books and apply them. */
export async function withFirstPageCovers<
  T extends { id: string; coverImageUrl: string | null },
>(books: T[]): Promise<T[]> {
  const ids = books.map((book) => book.id).filter((id) => UUID.test(id));
  if (ids.length === 0) return books;
  try {
    const { getSupabaseAdmin, isSupabaseAdminConfigured } = await import("@/lib/supabaseAdmin");
    if (!isSupabaseAdminConfigured()) return books;
    const { data, error } = await getSupabaseAdmin()
      .from("talisbooks_book_pages")
      .select("book_id, page_number, content")
      .in("book_id", ids)
      .lte("page_number", 2)
      .order("page_number", { ascending: true });
    if (error || !data) return books;
    return applyFirstPageCovers(
      books,
      pickFirstPageImages(
        data as Array<{ book_id: string; page_number: number; content: unknown }>,
      ),
    );
  } catch {
    return books;
  }
}
