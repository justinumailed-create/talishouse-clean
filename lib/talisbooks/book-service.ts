import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/database.types";
import type {
  TalisBooksActivityItem,
  TalisBooksBook,
  TalisBooksDashboardData,
  TalisBooksDashboardStats,
} from "./types";

type BookRow = Database["public"]["Tables"]["talisbooks_books"]["Row"];
type PageRow = Database["public"]["Tables"]["talisbooks_book_pages"]["Row"];
type PublishEventRow = Database["public"]["Tables"]["talisbooks_publish_events"]["Row"];

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

function toBookActivity(row: BookRow): TalisBooksActivityItem {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.slug,
    timestamp: row.updated_at,
    status: row.publish_status,
    badge: row.publish_status,
  };
}

function toPageActivity(row: PageRow, bookTitle?: string): TalisBooksActivityItem {
  return {
    id: row.id,
    title: row.title || `Page ${row.page_number}`,
    subtitle: bookTitle ? `${bookTitle} · p.${row.page_number}` : `Page ${row.page_number}`,
    timestamp: row.updated_at,
    badge: row.is_visible ? "visible" : "hidden",
  };
}

function toPublishActivity(row: PublishEventRow, bookTitle?: string): TalisBooksActivityItem {
  return {
    id: row.id,
    title: bookTitle ?? "Book",
    subtitle: row.from_status
      ? `${row.from_status} → ${row.to_status}`
      : `→ ${row.to_status}`,
    timestamp: row.created_at,
    status: row.to_status,
    badge: row.to_status,
  };
}

export async function listTalisBooks(): Promise<TalisBooksBook[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("talisbooks_books")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[talisbooks] listTalisBooks error:", error.message);
    return [];
  }

  return (data ?? []).map(toTalisBooksBook);
}

export async function getTalisBooksDashboardStats(): Promise<TalisBooksDashboardStats> {
  const data = await getTalisBooksDashboardData();
  return data.stats;
}

export async function getTalisBooksDashboardData(): Promise<TalisBooksDashboardData> {
  const supabase = getSupabaseAdmin();

  const [
    booksResult,
    pagesResult,
    templatesResult,
    imagesResult,
    authorsResult,
    latestBooksResult,
    recentPagesResult,
    recentPublishResult,
  ] = await Promise.all([
    supabase.from("talisbooks_books").select("id, publish_status"),
    supabase.from("talisbooks_book_pages").select("id", { count: "exact", head: true }),
    supabase.from("talisbooks_templates").select("id", { count: "exact", head: true }),
    supabase.from("talisbooks_images").select("id", { count: "exact", head: true }),
    supabase.from("talisbooks_authors").select("id", { count: "exact", head: true }),
    supabase
      .from("talisbooks_books")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("talisbooks_book_pages")
      .select("*, talisbooks_books(title)")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("talisbooks_publish_events")
      .select("*, talisbooks_books(title)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const books = booksResult.data ?? [];

  const stats: TalisBooksDashboardStats = {
    totalBooks: books.length,
    publishedBooks: books.filter((book) => book.publish_status === "published").length,
    draftBooks: books.filter((book) => book.publish_status === "draft").length,
    inReviewBooks: books.filter((book) => book.publish_status === "in_review").length,
    totalPages: pagesResult.count ?? 0,
    totalTemplates: templatesResult.count ?? 0,
    totalImages: imagesResult.count ?? 0,
    totalAuthors: authorsResult.count ?? 0,
  };

  const latestBooks = (latestBooksResult.data ?? []).map(toBookActivity);

  const recentPages = (recentPagesResult.data ?? []).map((row) => {
    const bookRelation = row.talisbooks_books as { title: string } | null;
    return toPageActivity(row as PageRow, bookRelation?.title);
  });

  const recentPublishEvents = (recentPublishResult.data ?? []).map((row) => {
    const bookRelation = row.talisbooks_books as { title: string } | null;
    return toPublishActivity(row as PublishEventRow, bookRelation?.title);
  });

  return {
    stats,
    latestBooks,
    recentPages,
    recentPublishEvents,
  };
}
