import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/database.types";
import type { TalisBooksBook, TalisBooksBookPage, TalisBooksPublishStatus } from "./types";
import {
  assertValidForPublishing,
  requiresPageRulesValidation,
  validateTalisBooksBookPages,
  type TalisBooksPublishValidationResult,
} from "./page-rules";
import { bookCenterfoldsApprovedForPublishing } from "./centerfold-service";

type BookRow = Database["public"]["Tables"]["talisbooks_books"]["Row"];
type PageRow = Database["public"]["Tables"]["talisbooks_book_pages"]["Row"];
type PublishEventInsert = Database["public"]["Tables"]["talisbooks_publish_events"]["Insert"];

function toTalisBooksBookPage(row: PageRow): TalisBooksBookPage {
  return {
    id: row.id,
    bookId: row.book_id,
    layoutId: row.layout_id,
    templateId: row.template_id,
    title: row.title,
    slug: row.slug,
    pageNumber: row.page_number,
    sortOrder: row.sort_order,
    content: (row.content as Record<string, unknown>) ?? {},
    backgroundImageId: row.background_image_id,
    isVisible: row.is_visible,
    settings: (row.settings as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toTalisBooksBook(row: BookRow): TalisBooksBook {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    publishStatus: row.publish_status as TalisBooksBook["publishStatus"],
    authorId: row.author_id,
    templateId: row.template_id,
    coverImageId: row.cover_image_id,
    accountId: row.account_id,
    mapsiteId: row.mapsite_id ?? null,
    fastCode: row.fast_code ?? null,
    parentBookId: row.parent_book_id ?? null,
    accountType: (row.account_type as TalisBooksBook["accountType"]) ?? "root",
    locale: row.locale,
    pageCount: row.page_count,
    isPublic: row.is_public,
    publishedAt: row.published_at,
    scheduledAt: row.scheduled_at,
    settings: (row.settings as Record<string, unknown>) ?? {},
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listTalisBooksBookPages(bookId: string): Promise<TalisBooksBookPage[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("talisbooks_book_pages")
    .select("*")
    .eq("book_id", bookId)
    .order("page_number", { ascending: true });

  if (error) {
    console.error("[talisbooks] listTalisBooksBookPages error:", error.message);
    return [];
  }

  return (data ?? []).map(toTalisBooksBookPage);
}

export async function validateTalisBooksBookForPublishing(
  bookId: string,
): Promise<TalisBooksPublishValidationResult> {
  const pages = await listTalisBooksBookPages(bookId);
  return validateTalisBooksBookPages(pages);
}

export interface PublishTalisBooksBookInput {
  bookId: string;
  toStatus: TalisBooksPublishStatus;
  changedBy?: string | null;
  note?: string;
}

export interface PublishTalisBooksBookResult {
  book: TalisBooksBook;
  validation: TalisBooksPublishValidationResult;
}

export async function publishTalisBooksBook(
  input: PublishTalisBooksBookInput,
): Promise<PublishTalisBooksBookResult> {
  const supabase = getSupabaseAdmin();
  const pages = await listTalisBooksBookPages(input.bookId);
  const validation = validateTalisBooksBookPages(pages);

  // Official page rules are enforced automatically — no manual overrides.
  if (requiresPageRulesValidation(input.toStatus) && !validation.valid) {
    const summary = validation.violations.map((violation) => violation.message).join(" ");
    throw new Error(`Talisbooks™ publish validation failed: ${summary}`);
  }

  // Centerfolds require admin preview approval before publishing.
  if (requiresPageRulesValidation(input.toStatus)) {
    const centerfoldGate = await bookCenterfoldsApprovedForPublishing(input.bookId);
    if (!centerfoldGate.approved) {
      throw new Error(
        `Talisbooks™ publish blocked: ${centerfoldGate.pending} centerfold(s) pending admin preview` +
          (centerfoldGate.rejected > 0
            ? ` and ${centerfoldGate.rejected} rejected.`
            : ". Approve centerfolds before publishing."),
      );
    }
  }

  const { data: existingBook, error: bookError } = await supabase
    .from("talisbooks_books")
    .select("*")
    .eq("id", input.bookId)
    .single();

  if (bookError || !existingBook) {
    throw new Error("Book not found.");
  }

  const publishedAt =
    input.toStatus === "published"
      ? new Date().toISOString()
      : existingBook.published_at;

  const { data: updatedBook, error: updateError } = await supabase
    .from("talisbooks_books")
    .update({
      publish_status: input.toStatus,
      published_at: publishedAt,
      page_count: validation.pageCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.bookId)
    .select("*")
    .single();

  if (updateError || !updatedBook) {
    throw new Error(updateError?.message ?? "Failed to update book publish status.");
  }

  const publishEvent: PublishEventInsert = {
    book_id: input.bookId,
    from_status: existingBook.publish_status,
    to_status: input.toStatus,
    note: input.note ?? "",
    changed_by: input.changedBy ?? null,
    metadata: {
      validationPassed: validation.valid,
      violationCount: validation.violations.length,
      violations: validation.violations,
    },
  };

  const { error: eventError } = await supabase
    .from("talisbooks_publish_events")
    .insert(publishEvent);

  if (eventError) {
    console.error("[talisbooks] publishTalisBooksBook event error:", eventError.message);
  }

  return {
    book: toTalisBooksBook(updatedBook),
    validation,
  };
}

export { assertValidForPublishing };
