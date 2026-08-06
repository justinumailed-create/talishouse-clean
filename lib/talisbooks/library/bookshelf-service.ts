import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/database.types";
import { TALISBOOKS_COVER_TEMPLATES } from "../covers/catalog";
import type { TalisBooksCoverTemplateId } from "../covers/constants";
import { TALISBOOKS_LIBRARY_PAGE_SIZE, TALISBOOKS_LIBRARY_SPINE_PALETTES } from "./constants";
import { createDemoBookshelf } from "./demo-shelf";
import { queryLibraryBooks } from "./query";
import type {
  TalisBooksBookshelf,
  TalisBooksLibraryBook,
  TalisBooksLibraryQuery,
  TalisBooksLibraryResult,
} from "./types";
import type { TalisBooksAccountType, TalisBooksPublishStatus } from "../types";

type BookRow = Database["public"]["Tables"]["talisbooks_books"]["Row"];
type ImageRow = Database["public"]["Tables"]["talisbooks_images"]["Row"];
type AnalyticsRow = Database["public"]["Tables"]["talisbooks_book_analytics"]["Row"];

function asTemplateId(value: unknown): TalisBooksCoverTemplateId | null {
  if (
    value === "aurora-frame" ||
    value === "horizon-caption" ||
    value === "masthead-rise" ||
    value === "cascade-editorial" ||
    value === "vista-overlay"
  ) {
    return value;
  }
  return null;
}

function coverGradientFor(templateId: TalisBooksCoverTemplateId | null, index: number): string {
  if (templateId && TALISBOOKS_COVER_TEMPLATES[templateId]) {
    return TALISBOOKS_COVER_TEMPLATES[templateId].previewGradient;
  }
  return TALISBOOKS_LIBRARY_SPINE_PALETTES[index % TALISBOOKS_LIBRARY_SPINE_PALETTES.length]!;
}

function toLibraryBook(
  row: BookRow,
  index: number,
  coverUrl: string | null,
  views: number,
  clicks: number,
): TalisBooksLibraryBook {
  const metadata = (row.metadata as Record<string, unknown>) ?? {};
  const coverTemplateId = asTemplateId(metadata.coverTemplateId);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    coverImageUrl: coverUrl,
    coverTemplateId,
    coverGradient: coverGradientFor(coverTemplateId, index),
    publishStatus: row.publish_status as TalisBooksPublishStatus,
    publishedAt: row.published_at,
    views,
    clicks,
    pageCount: row.page_count,
    accountId: row.account_id,
    accountType: (row.account_type as TalisBooksAccountType) ?? "root",
    mapsiteId: row.mapsite_id ?? null,
    fastCode: row.fast_code ?? null,
    parentBookId: row.parent_book_id ?? null,
  };
}

function buildStats(books: TalisBooksLibraryBook[]) {
  return {
    total: books.length,
    published: books.filter((book) => book.publishStatus === "published").length,
    draft: books.filter((book) => book.publishStatus === "draft").length,
    views: books.reduce((sum, book) => sum + book.views, 0),
    clicks: books.reduce((sum, book) => sum + book.clicks, 0),
  };
}

async function loadAnalyticsCounts(
  bookIds: string[],
): Promise<Map<string, { views: number; clicks: number }>> {
  const counts = new Map<string, { views: number; clicks: number }>();
  if (bookIds.length === 0) {
    return counts;
  }

  for (const id of bookIds) {
    counts.set(id, { views: 0, clicks: 0 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("talisbooks_book_analytics")
    .select("book_id, event_type")
    .in("book_id", bookIds);

  if (error || !data) {
    return counts;
  }

  for (const row of data as Pick<AnalyticsRow, "book_id" | "event_type">[]) {
    const entry = counts.get(row.book_id) ?? { views: 0, clicks: 0 };
    if (row.event_type === "view" || row.event_type === "page_view") {
      entry.views += 1;
    } else {
      // page_turn, share, qr_scan, export, audio_play → engagement clicks
      entry.clicks += 1;
    }
    counts.set(row.book_id, entry);
  }

  return counts;
}

/**
 * Personal bookshelf for a Root or Derivative account.
 * When `fastCode` is set (Mapsite™ TEB™), returns only that code's ebooks — not the demo library.
 */
export async function getTalisBooksBookshelf(options?: {
  accountId?: string | null;
  accountType?: "root" | "derivative";
  accountName?: string;
  fastCode?: string | null;
}): Promise<TalisBooksBookshelf> {
  const accountType = options?.accountType ?? "root";
  const accountId = options?.accountId ?? null;
  const fastCode = options?.fastCode?.trim().toLowerCase() || null;

  if (fastCode) {
    const { getMapSiteEbookContext } = await import("../mapsite-ebook-service");
    const { getTalisBooksEntitlementSnapshot } = await import("../entitlements");
    const [context, entitlements] = await Promise.all([
      getMapSiteEbookContext(fastCode),
      getTalisBooksEntitlementSnapshot(fastCode),
    ]);
    if (!context) {
      const { buildClaimedMapSitePath } = await import("@/lib/talispros/mapsite-state");
      return {
        accountId: null,
        accountType,
        accountName: `${fastCode.toUpperCase()} TEB™`,
        fastCode,
        mapsiteId: null,
        scopedToFastCode: true,
        paymentReceived: false,
        registrationHref: buildClaimedMapSitePath({
          fastCode,
          audience: "listings",
        }),
        entitlements,
        primaryEbook: null,
        books: [],
      };
    }
    return {
      accountId: null,
      accountType: context.accountType,
      accountName: `${fastCode.toUpperCase()} TEB™ shelf`,
      fastCode: context.fastCode,
      mapsiteId: context.mapsiteId,
      scopedToFastCode: true,
      paymentReceived: context.paymentReceived,
      registrationHref: context.registrationHref,
      entitlements,
      primaryEbook: context.primaryEbook,
      books: context.books,
    };
  }

  if (!accountId) {
    return createDemoBookshelf(accountType);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("talisbooks_books")
    .select("*")
    .eq("account_id", accountId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[talisbooks] getTalisBooksBookshelf error:", error.message);
    return createDemoBookshelf(accountType);
  }

  const rows = (data ?? []) as BookRow[];
  if (rows.length === 0) {
    const demo = createDemoBookshelf(accountType);
    return {
      ...demo,
      accountId,
      accountName: options?.accountName ?? demo.accountName,
      fastCode: options?.fastCode ?? demo.fastCode,
    };
  }

  const coverIds = rows
    .map((row) => row.cover_image_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  const coverMap = new Map<string, string>();
  if (coverIds.length > 0) {
    const { data: images } = await supabase
      .from("talisbooks_images")
      .select("id, url")
      .in("id", coverIds);
    for (const image of (images ?? []) as Pick<ImageRow, "id" | "url">[]) {
      coverMap.set(image.id, image.url);
    }
  }

  const analytics = await loadAnalyticsCounts(rows.map((row) => row.id));

  return {
    accountId,
    accountType,
    accountName: options?.accountName ?? "Bookshelf",
    fastCode: options?.fastCode ?? rows[0]?.fast_code ?? null,
    books: rows.map((row, index) => {
      const metrics = analytics.get(row.id) ?? { views: 0, clicks: 0 };
      return toLibraryBook(
        row,
        index,
        row.cover_image_id ? coverMap.get(row.cover_image_id) ?? null : null,
        metrics.views,
        metrics.clicks,
      );
    }),
  };
}

export async function getTalisBooksLibrary(
  options?: {
    accountId?: string | null;
    accountType?: "root" | "derivative";
    accountName?: string;
    fastCode?: string | null;
  },
  query: TalisBooksLibraryQuery = {},
): Promise<TalisBooksLibraryResult> {
  const bookshelf = await getTalisBooksBookshelf(options);
  const paged = queryLibraryBooks(bookshelf.books, {
    ...query,
    pageSize: query.pageSize ?? TALISBOOKS_LIBRARY_PAGE_SIZE,
  });

  return {
    bookshelf,
    books: paged.books,
    total: paged.total,
    page: paged.page,
    pageSize: paged.pageSize,
    pageCount: paged.pageCount,
    stats: buildStats(bookshelf.books),
  };
}
