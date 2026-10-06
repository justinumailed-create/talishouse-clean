/**
 * Owner Ebook Editor persistence. Every function re-checks that the book
 * belongs to the FAST Code; callers must also pass requireMapSiteEditAccess.
 */

import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { renumberBookPagesTwoPass } from "@/lib/talisbooks/renumber-book-pages";
import {
  isLockedPageContent,
  ownerEbookPageFromRow,
  sanitizeOwnerPagePatch,
  type OwnerEbookDetails,
  type OwnerEbookPage,
} from "@/lib/talisbooks/owner-ebook-editor-model";

type Result<T = unknown> = ({ success: true } & T) | { success: false; error: string };

const PAGE_COLUMNS = "id, book_id, page_number, sort_order, title, slug, content";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Book must exist and carry this FAST Code (never trust the client pairing). */
export async function assertOwnerBook(
  bookId: string,
  fastCodeRaw: string,
): Promise<
  | { ok: true; fastCode: string; book: Record<string, unknown> & { id: string; slug: string } }
  | { ok: false; error: string }
> {
  const fastCode = fastCodeRaw.trim().toLowerCase();
  if (!bookId?.trim() || !fastCode) return { ok: false, error: "Book and FAST Code are required." };
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "Database is not configured." };
  const { data, error } = await getSupabaseAdmin()
    .from("talisbooks_books")
    .select("id, slug, title, subtitle, description, publish_status, page_count, fast_code, metadata, cover_image_id")
    .eq("id", bookId.trim())
    .maybeSingle();
  if (error || !data) return { ok: false, error: "Ebook not found." };
  if (String(data.fast_code || "").trim().toLowerCase() !== fastCode) {
    return { ok: false, error: "Ebook does not belong to this FAST Code." };
  }
  return { ok: true, fastCode, book: data as Record<string, unknown> & { id: string; slug: string } };
}

async function listPageRows(bookId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("talisbooks_book_pages")
    .select(PAGE_COLUMNS)
    .eq("book_id", bookId)
    .order("page_number", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function loadOwnerEbook(
  fastCode: string,
  bookId: string,
): Promise<Result<{ book: OwnerEbookDetails; pages: OwnerEbookPage[] }>> {
  const owned = await assertOwnerBook(bookId, fastCode);
  if (!owned.ok) return { success: false, error: owned.error };
  const rows = await listPageRows(owned.book.id);
  const metadata = record(owned.book.metadata);
  return {
    success: true,
    book: {
      id: owned.book.id,
      slug: owned.book.slug,
      title: String(owned.book.title || ""),
      subtitle: String(owned.book.subtitle || ""),
      description: String(owned.book.description || ""),
      coverImageUrl:
        typeof metadata.coverImageUrl === "string" ? metadata.coverImageUrl : null,
      publishStatus: String(owned.book.publish_status || "draft"),
      pageCount: rows.length,
      fastCode: owned.fastCode,
    },
    pages: rows.map(ownerEbookPageFromRow),
  };
}

/**
 * Two-pass renumber so the UNIQUE (book_id, page_number) index never collides.
 * `orderedIds` must list every page of the book exactly once.
 */
export async function renumberOwnerEbookPages(
  bookId: string,
  orderedIds: string[],
): Promise<Result> {
  const supabase = getSupabaseAdmin();
  const rows = await listPageRows(bookId);
  const existing = new Set(rows.map((row) => row.id));
  if (orderedIds.length !== rows.length || orderedIds.some((id) => !existing.has(id))) {
    return { success: false, error: "Page order must include every page exactly once." };
  }
  if (new Set(orderedIds).size !== orderedIds.length) {
    return { success: false, error: "Page order has duplicates." };
  }
  const now = new Date().toISOString();
  const renumbered = await renumberBookPagesTwoPass(supabase, bookId, orderedIds, now);
  if (!renumbered.success) return renumbered;
  await supabase
    .from("talisbooks_books")
    .update({ page_count: orderedIds.length, updated_at: now })
    .eq("id", bookId);
  return { success: true };
}

export async function reorderOwnerEbookPages(input: {
  fastCode: string;
  bookId: string;
  orderedPageIds: string[];
}): Promise<Result> {
  const owned = await assertOwnerBook(input.bookId, input.fastCode);
  if (!owned.ok) return { success: false, error: owned.error };
  const rows = await listPageRows(owned.book.id);
  const byId = new Map(rows.map((row) => [row.id, row]));
  // Locked pages keep their index; only editable pages move.
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!;
    if (isLockedPageContent(record(row.content)) && input.orderedPageIds[index] !== row.id) {
      return { success: false, error: "Locked pages cannot be moved." };
    }
  }
  if (input.orderedPageIds.some((id) => !byId.has(id))) {
    return { success: false, error: "Unknown page in order." };
  }
  return renumberOwnerEbookPages(owned.book.id, input.orderedPageIds);
}

export async function updateOwnerEbookDetails(input: {
  fastCode: string;
  bookId: string;
  title: string;
  subtitle: string;
  description: string;
  /** Shelf + viewer front cover. Also updates the front-cover page image. */
  coverImageUrl?: string | null;
}): Promise<Result> {
  const owned = await assertOwnerBook(input.bookId, input.fastCode);
  if (!owned.ok) return { success: false, error: owned.error };
  const title = input.title.trim().slice(0, 200);
  if (!title) return { success: false, error: "Title is required." };
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const metadata = { ...record(owned.book.metadata) };
  const cover = input.coverImageUrl?.trim() || null;
  if (cover) metadata.coverImageUrl = cover;

  const { error } = await supabase
    .from("talisbooks_books")
    .update({
      title,
      subtitle: input.subtitle.trim().slice(0, 300),
      description: input.description.trim().slice(0, 4000),
      metadata,
      // metadata.coverImageUrl only wins on the shelf when no cover_image_id is set.
      ...(cover ? { cover_image_id: null } : {}),
      updated_at: now,
    })
    .eq("id", owned.book.id);
  if (error) return { success: false, error: error.message };

  if (cover) {
    const rows = await listPageRows(owned.book.id);
    const first = rows[0];
    const content = record(first?.content);
    if (first && content.layout === "cover" && !isLockedPageContent(content)) {
      await supabase
        .from("talisbooks_book_pages")
        .update({ content: { ...content, heroImageUrl: cover }, updated_at: now })
        .eq("id", first.id)
        .eq("book_id", owned.book.id);
    }
  }
  return { success: true };
}

export async function updateOwnerEbookPage(input: {
  fastCode: string;
  bookId: string;
  pageId: string;
  text?: Record<string, unknown> | null;
  images?: Record<string, unknown> | null;
  captionsEnabled?: boolean;
}): Promise<Result<{ page: OwnerEbookPage }>> {
  const owned = await assertOwnerBook(input.bookId, input.fastCode);
  if (!owned.ok) return { success: false, error: owned.error };
  const supabase = getSupabaseAdmin();
  const rows = await listPageRows(owned.book.id);
  const index = rows.findIndex((row) => row.id === input.pageId);
  const row = rows[index];
  if (!row) return { success: false, error: "Page not found." };
  const content = record(row.content);
  if (isLockedPageContent(content)) {
    return { success: false, error: "This page is locked and cannot be edited here." };
  }
  const patch = sanitizeOwnerPagePatch(input);
  const nextContent: Record<string, unknown> = { ...content, ...patch.text, ...patch.images };
  if (patch.captionsEnabled !== undefined) nextContent.captionsEnabled = patch.captionsEnabled;
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("talisbooks_book_pages")
    .update({
      title: patch.text.title !== undefined ? patch.text.title.trim() || row.title : row.title,
      content: nextContent,
      updated_at: now,
    })
    .eq("id", row.id)
    .eq("book_id", owned.book.id);
  if (error) return { success: false, error: error.message };

  // Centerfold spreads share one spread image across the left + right leaves.
  const spread = patch.images.spreadImageUrl;
  const layout = String(content.layout || "");
  if (spread && (layout === "centerfold_left" || layout === "centerfold_right")) {
    const mate = rows[layout === "centerfold_left" ? index + 1 : index - 1];
    const mateContent = record(mate?.content);
    const expected = layout === "centerfold_left" ? "centerfold_right" : "centerfold_left";
    if (mate && mateContent.layout === expected && !isLockedPageContent(mateContent)) {
      await supabase
        .from("talisbooks_book_pages")
        .update({ content: { ...mateContent, spreadImageUrl: spread }, updated_at: now })
        .eq("id", mate.id)
        .eq("book_id", owned.book.id);
    }
  }
  await supabase.from("talisbooks_books").update({ updated_at: now }).eq("id", owned.book.id);
  return { success: true, page: ownerEbookPageFromRow({ ...row, content: nextContent }) };
}

export async function deleteOwnerEbookPages(input: {
  fastCode: string;
  bookId: string;
  pageIds: string[];
}): Promise<Result> {
  const owned = await assertOwnerBook(input.bookId, input.fastCode);
  if (!owned.ok) return { success: false, error: owned.error };
  const rows = await listPageRows(owned.book.id);
  const remove = new Set(input.pageIds);
  const targets = rows.filter((row) => remove.has(row.id));
  if (targets.length === 0) return { success: false, error: "Page not found." };
  if (targets.some((row) => isLockedPageContent(record(row.content)))) {
    return { success: false, error: "Locked pages cannot be deleted." };
  }
  const first = rows[0];
  const last = rows[rows.length - 1];
  if (
    targets.some(
      (row) =>
        (row.id === first?.id || row.id === last?.id) &&
        record(row.content).layout === "cover",
    )
  ) {
    return { success: false, error: "Front and back covers cannot be deleted. Replace the image instead." };
  }
  if (rows.length - targets.length < 2) {
    return { success: false, error: "An ebook needs at least a front and back cover." };
  }
  const { error } = await getSupabaseAdmin()
    .from("talisbooks_book_pages")
    .delete()
    .eq("book_id", owned.book.id)
    .in("id", targets.map((row) => row.id));
  if (error) return { success: false, error: error.message };
  return renumberOwnerEbookPages(
    owned.book.id,
    rows.filter((row) => !remove.has(row.id)).map((row) => row.id),
  );
}

/**
 * Add a page. Template books with centerfold spreads get a new left+right
 * spread sharing one image; other books get a single captioned image page.
 * Inserted before the back cover (or after `afterPageId`).
 */
export async function addOwnerEbookPage(input: {
  fastCode: string;
  bookId: string;
  imageUrl: string;
  title?: string;
  body?: string;
  afterPageId?: string | null;
}): Promise<Result> {
  const owned = await assertOwnerBook(input.bookId, input.fastCode);
  if (!owned.ok) return { success: false, error: owned.error };
  const imageUrl = input.imageUrl.trim();
  if (!imageUrl) return { success: false, error: "Upload an image for the new page." };
  const supabase = getSupabaseAdmin();
  const rows = await listPageRows(owned.book.id);
  if (rows.length >= 200) return { success: false, error: "This ebook is at the 200 page limit." };

  const template = rows.find(
    (row) => record(row.content).layout === "centerfold_left" && !isLockedPageContent(record(row.content)),
  );
  const templateContent = record(template?.content);
  const title = input.title?.trim().slice(0, 200) || "New page";
  const body = (input.body || "").slice(0, 8000);
  const stamp = Date.now().toString(36);
  const offset = 200000 + rows.length;

  const base = template
    ? {
        layoutType: templateContent.layoutType,
        templateId: templateContent.templateId,
        spreadMat: templateContent.spreadMat,
        captionsEnabled: Boolean(body),
        captionSkipped: !body,
      }
    : {};
  const newRows = template
    ? [
        {
          slug: `owner-${stamp}-left`,
          content: {
            ...base,
            title,
            body,
            layout: "centerfold_left",
            pageRole: "interior",
            brochureLeaf: "left",
            templateRole: "caption_left",
            spreadImageUrl: imageUrl,
          },
        },
        {
          slug: `owner-${stamp}-right`,
          content: {
            ...base,
            title,
            body: "",
            layout: "centerfold_right",
            pageRole: "interior",
            brochureLeaf: "right",
            templateRole: "caption_right",
            spreadImageUrl: imageUrl,
          },
        },
      ]
    : [
        {
          slug: `owner-${stamp}`,
          content: { title, body, layout: "caption", pageRole: "interior", heroImageUrl: imageUrl },
        },
      ];

  const { data: inserted, error } = await supabase
    .from("talisbooks_book_pages")
    .insert(
      newRows.map((row, index) => ({
        book_id: owned.book.id,
        title,
        slug: row.slug,
        page_number: offset + index + 1,
        sort_order: offset + index + 1,
        content: row.content,
      })),
    )
    .select("id");
  if (error || !inserted) return { success: false, error: error?.message || "Could not add page." };

  const ids = rows.map((row) => row.id);
  const lastContent = record(rows[rows.length - 1]?.content);
  let insertAt =
    rows.length > 1 && lastContent.layout === "cover" ? rows.length - 1 : rows.length;
  if (input.afterPageId) {
    const after = ids.indexOf(input.afterPageId);
    if (after >= 0) insertAt = Math.min(after + 1, insertAt);
  }
  // Never split an existing spread.
  const before = rows[insertAt - 1];
  if (before && record(before.content).layout === "centerfold_left") insertAt += 1;
  ids.splice(insertAt, 0, ...inserted.map((row) => row.id));
  return renumberOwnerEbookPages(owned.book.id, ids);
}
