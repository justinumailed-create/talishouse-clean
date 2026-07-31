/**
 * Marketing / MapSite admin helpers for form-driven TalisBooks™ page management.
 * No HTML editing — title, body, image URL/file, and reorder only.
 */

import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { ROUTES } from "@/lib/routes";
import { TALISBOOKS_IMAGE_STORAGE_BUCKET } from "@/lib/talisbooks/image-engine";
import type { TalisBooksPublishStatus } from "@/lib/talisbooks/types";
import { getMapSiteEbookContext } from "@/lib/talisbooks/mapsite-ebook-service";

export type AdminEbookPageRow = {
  id: string;
  pageNumber: number;
  sortOrder: number;
  title: string;
  slug: string;
  layout: string;
  heroImageUrl: string | null;
  body: string;
  isPermanent: boolean;
  systemKey: string | null;
};

function contentRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function rowToAdminPage(row: {
  id: string;
  page_number: number;
  sort_order: number;
  title: string;
  slug: string;
  content: unknown;
}): AdminEbookPageRow {
  const content = contentRecord(row.content);
  const layout =
    typeof content.layout === "string" ? content.layout : "caption";
  const systemKey =
    typeof content.systemKey === "string" ? content.systemKey : null;
  const isPermanent =
    content.isPermanent === true ||
    content.clientEditable === false ||
    Boolean(systemKey);

  return {
    id: row.id,
    pageNumber: row.page_number,
    sortOrder: row.sort_order,
    title:
      (typeof content.title === "string" && content.title) ||
      row.title ||
      "Untitled",
    slug: row.slug,
    layout,
    heroImageUrl:
      typeof content.heroImageUrl === "string" ? content.heroImageUrl : null,
    body: typeof content.body === "string" ? content.body : "",
    isPermanent,
    systemKey,
  };
}

export async function listAdminEbookPages(
  bookId: string,
): Promise<AdminEbookPageRow[]> {
  if (!bookId || !isSupabaseAdminConfigured()) return [];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("talisbooks_book_pages")
    .select("id, page_number, sort_order, title, slug, content")
    .eq("book_id", bookId)
    .order("page_number", { ascending: true });

  if (error) {
    console.error("[admin-ebook-pages] list error:", error.message);
    return [];
  }

  return (data ?? []).map(rowToAdminPage);
}

async function assertBookBelongsToFastCode(
  bookId: string,
  fastCodeRaw: string,
): Promise<{ ok: true; fastCode: string } | { ok: false; error: string }> {
  const fastCode = fastCodeRaw.trim().toLowerCase();
  if (!fastCode || !bookId) {
    return { ok: false, error: "Book and FAST Code are required." };
  }
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Database is not configured." };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("talisbooks_books")
    .select("id, fast_code")
    .eq("id", bookId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Ebook not found." };
  }
  if ((data.fast_code || "").toLowerCase() !== fastCode) {
    return { ok: false, error: "Ebook does not belong to this FAST Code." };
  }
  return { ok: true, fastCode };
}

export async function updateAdminEbookPageFields(input: {
  fastCode: string;
  bookId: string;
  pageId: string;
  title?: string;
  body?: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const owned = await assertBookBelongsToFastCode(input.bookId, input.fastCode);
  if (!owned.ok) return { success: false, error: owned.error };

  const supabase = getSupabaseAdmin();
  const { data: page, error } = await supabase
    .from("talisbooks_book_pages")
    .select("id, book_id, title, content")
    .eq("id", input.pageId)
    .eq("book_id", input.bookId)
    .maybeSingle();

  if (error || !page) {
    return { success: false, error: "Page not found." };
  }

  const content = contentRecord(page.content);
  if (
    content.isPermanent === true ||
    content.clientEditable === false ||
    typeof content.systemKey === "string"
  ) {
    return {
      success: false,
      error: "Permanent system pages cannot be edited here.",
    };
  }

  const nextContent = { ...content };
  if (input.title !== undefined) {
    nextContent.title = input.title.trim();
  }
  if (input.body !== undefined) {
    nextContent.body = input.body;
  }

  const { error: updateError } = await supabase
    .from("talisbooks_book_pages")
    .update({
      title:
        input.title !== undefined
          ? input.title.trim() || page.title
          : page.title,
      content: nextContent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.pageId)
    .eq("book_id", input.bookId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }
  return { success: true };
}

async function uploadAdminPageImage(options: {
  fastCode: string;
  pageId: string;
  file: File;
}): Promise<string | null> {
  const buffer = Buffer.from(await options.file.arrayBuffer());
  const mimeType = options.file.type || "image/jpeg";
  const supabase = getSupabaseAdmin();
  const ext =
    mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const path = `admin-pages/${options.fastCode}/${options.pageId}-${Date.now()}.${ext}`;

  const primary = await supabase.storage
    .from(TALISBOOKS_IMAGE_STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (!primary.error) {
    return (
      supabase.storage.from(TALISBOOKS_IMAGE_STORAGE_BUCKET).getPublicUrl(path)
        .data.publicUrl || null
    );
  }

  const fallback = await supabase.storage.from("mapsite-assets").upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  });
  if (fallback.error) {
    console.error(
      "[admin-ebook-pages] upload failed:",
      primary.error.message,
      fallback.error.message,
    );
    return null;
  }
  return (
    supabase.storage.from("mapsite-assets").getPublicUrl(path).data.publicUrl ||
    null
  );
}

export async function replaceAdminEbookPageImage(input: {
  fastCode: string;
  bookId: string;
  pageId: string;
  imageUrl?: string | null;
  imageFile?: File | null;
}): Promise<{ success: true; imageUrl: string } | { success: false; error: string }> {
  const owned = await assertBookBelongsToFastCode(input.bookId, input.fastCode);
  if (!owned.ok) return { success: false, error: owned.error };

  const supabase = getSupabaseAdmin();
  const { data: page, error } = await supabase
    .from("talisbooks_book_pages")
    .select("id, content")
    .eq("id", input.pageId)
    .eq("book_id", input.bookId)
    .maybeSingle();

  if (error || !page) {
    return { success: false, error: "Page not found." };
  }

  const content = contentRecord(page.content);
  if (
    content.isPermanent === true ||
    content.clientEditable === false ||
    typeof content.systemKey === "string"
  ) {
    return {
      success: false,
      error: "Permanent Glasshouse brochure pages are replaced globally, not per book.",
    };
  }

  let imageUrl = input.imageUrl?.trim() || "";
  if (input.imageFile && input.imageFile.size > 0) {
    const uploaded = await uploadAdminPageImage({
      fastCode: owned.fastCode,
      pageId: input.pageId,
      file: input.imageFile,
    });
    if (!uploaded) {
      return { success: false, error: "Could not upload image. Try JPG or PNG." };
    }
    imageUrl = uploaded;
  }

  if (!imageUrl) {
    return { success: false, error: "Provide an image URL or upload a file." };
  }

  const { error: updateError } = await supabase
    .from("talisbooks_book_pages")
    .update({
      content: {
        ...content,
        heroImageUrl: imageUrl,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.pageId)
    .eq("book_id", input.bookId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }
  return { success: true, imageUrl };
}

/**
 * Reorder editable pages. Permanent brochure pages stay before the back cover.
 */
export async function reorderAdminEbookPages(input: {
  fastCode: string;
  bookId: string;
  orderedPageIds: string[];
}): Promise<{ success: true } | { success: false; error: string }> {
  const owned = await assertBookBelongsToFastCode(input.bookId, input.fastCode);
  if (!owned.ok) return { success: false, error: owned.error };

  const pages = await listAdminEbookPages(input.bookId);
  if (pages.length === 0) {
    return { success: false, error: "No pages to reorder." };
  }

  const byId = new Map(pages.map((page) => [page.id, page]));
  const brochure = pages
    .filter((page) => page.isPermanent)
    .sort((a, b) => a.pageNumber - b.pageNumber);

  const last = pages[pages.length - 1]!;
  const backCover =
    !last.isPermanent && (last.layout === "cover" || last.slug === "back-cover")
      ? last
      : null;

  const movable = pages.filter(
    (page) => !page.isPermanent && page.id !== backCover?.id,
  );

  const requestedMovable = input.orderedPageIds
    .map((id) => byId.get(id))
    .filter((page): page is AdminEbookPageRow => {
      if (!page) return false;
      return !page.isPermanent && page.id !== backCover?.id;
    });

  // Allow partial lists: if admin only sends movable ids, accept that.
  const finalMovable =
    requestedMovable.length === movable.length
      ? requestedMovable
      : input.orderedPageIds.length === 0
        ? movable
        : null;

  if (!finalMovable) {
    return {
      success: false,
      error: "Reorder list must include every editable page exactly once.",
    };
  }

  const nextOrder = [
    ...finalMovable,
    ...brochure,
    ...(backCover ? [backCover] : []),
  ];

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  for (let index = 0; index < nextOrder.length; index += 1) {
    const page = nextOrder[index]!;
    const pageNumber = index + 1;
    const { error } = await supabase
      .from("talisbooks_book_pages")
      .update({
        page_number: pageNumber,
        sort_order: pageNumber,
        updated_at: now,
      })
      .eq("id", page.id)
      .eq("book_id", input.bookId);
    if (error) {
      return { success: false, error: error.message };
    }
  }

  await supabase
    .from("talisbooks_books")
    .update({
      page_count: nextOrder.length,
      updated_at: now,
    })
    .eq("id", input.bookId);

  return { success: true };
}

export async function setAdminEbookPublishStatus(input: {
  fastCode: string;
  bookId: string;
  status: Extract<TalisBooksPublishStatus, "draft" | "published">;
  /** Marketing/admin bypass — client publish must not set this. */
  asAdmin?: boolean;
}): Promise<{ success: true; status: string } | { success: false; error: string }> {
  const owned = await assertBookBelongsToFastCode(input.bookId, input.fastCode);
  if (!owned.ok) return { success: false, error: owned.error };

  if (input.status === "published" && !input.asAdmin) {
    const { getTalisBooksEntitlementSnapshot, assertTalisBooksFeature } = await import(
      "@/lib/talisbooks/entitlements"
    );
    const entitlements = await getTalisBooksEntitlementSnapshot(owned.fastCode);
    if (entitlements) {
      const gate = assertTalisBooksFeature(entitlements, "publish");
      if (!gate.ok) {
        return { success: false, error: gate.error };
      }
      const marketing = assertTalisBooksFeature(entitlements, "global_marketing");
      if (!marketing.ok) {
        return { success: false, error: marketing.error };
      }
    }
  }

  const pages = await listAdminEbookPages(input.bookId);
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("talisbooks_books")
    .select("metadata")
    .eq("id", input.bookId)
    .maybeSingle();

  const metadata = {
    ...(typeof existing?.metadata === "object" && existing.metadata
      ? (existing.metadata as Record<string, unknown>)
      : {}),
    listingProfile: "fsbo",
    source: "mapsite-teb-admin",
    globallyPublished: input.status === "published",
  };

  const { error } = await supabase
    .from("talisbooks_books")
    .update({
      publish_status: input.status,
      published_at: input.status === "published" ? now : null,
      is_public: input.status === "published",
      page_count: pages.length,
      updated_at: now,
      metadata,
    })
    .eq("id", input.bookId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, status: input.status };
}

export async function attachEbookViewerToMapSite(input: {
  fastCode: string;
  bookId: string;
}): Promise<
  | { success: true; tebUrl: string; viewerPath: string }
  | { success: false; error: string }
> {
  const owned = await assertBookBelongsToFastCode(input.bookId, input.fastCode);
  if (!owned.ok) return { success: false, error: owned.error };

  const supabase = getSupabaseAdmin();
  const { data: book, error } = await supabase
    .from("talisbooks_books")
    .select("slug")
    .eq("id", input.bookId)
    .maybeSingle();

  if (error || !book?.slug) {
    return { success: false, error: "Ebook slug not found." };
  }

  const viewerPath = `${ROUTES.TALISBOOKS_VIEWER}/${book.slug}`;
  const { error: mapsiteError } = await supabase
    .from("mapsites")
    .update({
      teb_url: viewerPath,
      updated_at: new Date().toISOString(),
    })
    .ilike("fast_code", owned.fastCode);

  if (mapsiteError) {
    return { success: false, error: mapsiteError.message };
  }

  return { success: true, tebUrl: viewerPath, viewerPath };
}

export function buildAbsoluteBookUrl(viewerPath: string): string {
  if (viewerPath.startsWith("http")) return viewerPath;
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "";
  return base ? `${base}${viewerPath}` : viewerPath;
}

export async function getAdminEbookWorkbench(fastCodeRaw: string): Promise<{
  ebook: {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    coverImageUrl: string | null;
    publishStatus: string;
    pageCount: number;
    viewerPath: string;
    bookUrl: string;
    attachedTebUrl: string | null;
  } | null;
  pages: AdminEbookPageRow[];
} | null> {
  const context = await getMapSiteEbookContext(fastCodeRaw);
  if (!context?.primaryEbook) {
    return { ebook: null, pages: [] };
  }

  const supabase = getSupabaseAdmin();
  const [{ data: book }, { data: mapsite }] = await Promise.all([
    supabase
      .from("talisbooks_books")
      .select("id, slug, title, subtitle, description, publish_status, page_count, metadata")
      .eq("id", context.primaryEbook.id)
      .maybeSingle(),
    supabase
      .from("mapsites")
      .select("teb_url")
      .ilike("fast_code", context.fastCode)
      .maybeSingle(),
  ]);

  if (!book) {
    return { ebook: null, pages: [] };
  }

  const metadata = contentRecord(book.metadata);
  const viewerPath = `${ROUTES.TALISBOOKS_VIEWER}/${book.slug}`;
  const pages = await listAdminEbookPages(book.id);

  return {
    ebook: {
      id: book.id,
      slug: book.slug,
      title: book.title,
      subtitle: book.subtitle,
      description: book.description,
      coverImageUrl:
        typeof metadata.coverImageUrl === "string"
          ? metadata.coverImageUrl
          : context.primaryEbook.coverImageUrl,
      publishStatus: book.publish_status,
      pageCount: book.page_count || pages.length,
      viewerPath,
      bookUrl: buildAbsoluteBookUrl(viewerPath),
      attachedTebUrl:
        typeof mapsite?.teb_url === "string" ? mapsite.teb_url : null,
    },
    pages,
  };
}
