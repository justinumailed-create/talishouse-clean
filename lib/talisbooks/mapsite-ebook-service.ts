import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";
import { getViewerBookBySlug } from "@/lib/talisbooks/viewer/load-book";
import { hasCompletedMapSiteActivationPayment } from "@/lib/talispros/mapsite-payment";
import {
  buildClaimedMapSitePath,
  mapsiteAccountTypeSegment,
} from "@/lib/talispros/mapsite-state";
import { isDemoMapSiteCode } from "@/lib/talispros/demo-mapsite";
import { listingImageUrlsFromEbookPages } from "@/lib/talispros/mapsite-listing-media";
import type { TalisBooksLibraryBook } from "./library/types";
import { TALISBOOKS_COVER_TEMPLATES } from "./covers/catalog";
import type { TalisBooksCoverTemplateId } from "./covers/constants";
import { TALISBOOKS_LIBRARY_SPINE_PALETTES } from "./library/constants";
import type { TalisBooksAccountType, TalisBooksPublishStatus } from "./types";
import { createGlasshouseBrochureDbRows } from "./permanent-pages";
import {
  assertTalisBooksFeature,
  getTalisBooksEntitlementSnapshot,
} from "./entitlements";

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function coverGradient(index: number): string {
  const templateId = (Object.keys(TALISBOOKS_COVER_TEMPLATES)[
    index % Object.keys(TALISBOOKS_COVER_TEMPLATES).length
  ] ?? "aurora-frame") as TalisBooksCoverTemplateId;
  return (
    TALISBOOKS_COVER_TEMPLATES[templateId]?.previewGradient ??
    TALISBOOKS_LIBRARY_SPINE_PALETTES[index % TALISBOOKS_LIBRARY_SPINE_PALETTES.length]!
  );
}

function toLibraryBook(
  row: {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    publish_status: string;
    published_at: string | null;
    page_count: number;
    account_id: string | null;
    account_type: string;
    mapsite_id: string | null;
    fast_code: string | null;
    parent_book_id: string | null;
    metadata: Record<string, unknown> | null;
  },
  index: number
): TalisBooksLibraryBook {
  const metadata = row.metadata ?? {};
  const coverTemplateId =
    metadata.coverTemplateId === "aurora-frame" ||
    metadata.coverTemplateId === "horizon-caption" ||
    metadata.coverTemplateId === "masthead-rise" ||
    metadata.coverTemplateId === "cascade-editorial" ||
    metadata.coverTemplateId === "vista-overlay"
      ? (metadata.coverTemplateId as TalisBooksCoverTemplateId)
      : null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    coverImageUrl:
      typeof metadata.coverImageUrl === "string" ? metadata.coverImageUrl : null,
    coverTemplateId,
    coverGradient: coverGradient(index),
    publishStatus: row.publish_status as TalisBooksPublishStatus,
    publishedAt: row.published_at,
    views: 0,
    clicks: 0,
    pageCount: row.page_count,
    accountId: row.account_id,
    accountType: (row.account_type as TalisBooksAccountType) ?? "root",
    mapsiteId: row.mapsite_id,
    fastCode: row.fast_code,
    parentBookId: row.parent_book_id,
  };
}

export type MapSiteEbookDraft = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  coverImageUrl: string | null;
  listingImageUrls?: string[];
};

export type MapSiteEbookContext = {
  fastCode: string;
  mapsiteId: string | null;
  accountType: Extract<TalisBooksAccountType, "root" | "derivative">;
  audience: string;
  paymentReceived: boolean;
  registrationHref: string;
  books: TalisBooksLibraryBook[];
  primaryEbook: MapSiteEbookDraft | null;
};

function listingImageUrlsFromMetadata(
  metadata: Record<string, unknown> | null,
): string[] {
  const raw = metadata?.galleryImageUrls;
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const value of raw) {
    if (typeof value !== "string") continue;
    const url = value.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

export function ebookSlugFromTebUrl(tebUrl: string | null | undefined): string | null {
  const value = tebUrl?.trim() || "";
  if (!value) return null;
  try {
    const path = value.startsWith("http://") || value.startsWith("https://")
      ? new URL(value).pathname
      : value.split("?")[0] || "";
    const prefix = `${TALISBOOKS_ROUTES.VIEWER}/`;
    const index = path.toLowerCase().indexOf(prefix);
    if (index < 0) return null;
    const slug = decodeURIComponent(path.slice(index + prefix.length).split("/")[0] || "").trim();
    return slug || null;
  } catch {
    return null;
  }
}

function pageRecordFromContent(content: unknown): Record<string, unknown> | null {
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content) as unknown;
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  if (content && typeof content === "object") {
    return content as Record<string, unknown>;
  }
  return null;
}

async function loadListingImagesFromBookPages(
  bookId: string,
): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const { data: pages } = await supabase
    .from("talisbooks_book_pages")
    .select("*")
    .eq("book_id", bookId)
    .order("page_number", { ascending: true });

  return listingImageUrlsFromEbookPages(
    (pages ?? []).map((page) => {
      const record = pageRecordFromContent(page.content) ?? {};
      return {
        pageRole: typeof record.pageRole === "string" ? record.pageRole : null,
        layout: typeof record.layout === "string" ? record.layout : null,
        systemKey: typeof record.systemKey === "string" ? record.systemKey : null,
        spreadImageUrl:
          typeof record.spreadImageUrl === "string" ? record.spreadImageUrl : null,
        heroImageUrl:
          typeof record.heroImageUrl === "string" ? record.heroImageUrl : null,
      };
    }),
  );
}

export async function resolveEbookListingImageUrls(options: {
  listingImageUrls?: string[] | null;
  bookSlug?: string | null;
  tebUrl?: string | null;
}): Promise<string[]> {
  const fromContext = listingImageUrlsFromEbookPages(
    (options.listingImageUrls ?? []).map((url) => ({ spreadImageUrl: url })),
  );
  if (fromContext.length > 0) return fromContext;

  const slug =
    options.bookSlug?.trim() || ebookSlugFromTebUrl(options.tebUrl) || "";
  if (!slug || !isSupabaseAdminConfigured()) return [];

  const viewer = await getViewerBookBySlug(slug);
  return listingImageUrlsFromEbookPages(viewer?.pages ?? []);
}

function toDraft(
  row: {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    metadata: Record<string, unknown> | null;
  } | null,
  listingImageUrls: string[] = [],
): MapSiteEbookDraft | null {
  if (!row) return null;
  const metadata = row.metadata ?? {};
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    coverImageUrl:
      typeof metadata.coverImageUrl === "string" ? metadata.coverImageUrl : null,
    listingImageUrls,
  };
}

export async function getMapSiteEbookContext(
  fastCodeRaw: string,
  options?: { bookSlug?: string | null },
): Promise<MapSiteEbookContext | null> {
  const fastCode = fastCodeRaw.trim().toLowerCase();
  if (!fastCode || fastCode === "demo" || isDemoMapSiteCode(fastCode)) return null;
  if (!isSupabaseAdminConfigured()) {
    return {
      fastCode,
      mapsiteId: null,
      accountType: "root",
      audience: "listings",
      paymentReceived: false,
      registrationHref: buildClaimedMapSitePath({
        fastCode,
        audience: "listings",
      }),
      books: [],
      primaryEbook: null,
    };
  }

  const supabase = getSupabaseAdmin();

  const [{ data: codeRow }, { data: mapsiteByCode }, { data: books }] =
    await Promise.all([
      supabase
        .from("fast_codes")
        .select("code, mapsite_id, request_id, account_type")
        .ilike("code", fastCode)
        .maybeSingle(),
      supabase
        .from("mapsites")
        .select("id, fast_code, account_type, account_id, email")
        .ilike("fast_code", fastCode)
        .maybeSingle(),
      supabase
        .from("talisbooks_books")
        .select("*")
        .ilike("fast_code", fastCode)
        .order("updated_at", { ascending: false }),
    ]);

  let mapsiteId = mapsiteByCode?.id ?? codeRow?.mapsite_id ?? null;
  let requestId = codeRow?.request_id ?? null;
  let audience = "listings";
  let accountType: Extract<TalisBooksAccountType, "root" | "derivative"> = "root";

  if (requestId) {
    const { data: request } = await supabase
      .from("build_requests")
      .select("linked_mapsite_id, market_type, requested_account_type, account_type")
      .eq("id", requestId)
      .maybeSingle();
    mapsiteId = mapsiteId ?? request?.linked_mapsite_id ?? null;
    audience = mapsiteAccountTypeSegment(
      request?.market_type || request?.requested_account_type || request?.account_type
    );
    const requested = (request?.requested_account_type || request?.account_type || "")
      .toLowerCase();
    if (requested === "derivative") accountType = "derivative";
  } else if (codeRow?.account_type?.toLowerCase() === "derivative") {
    accountType = "derivative";
  }

  if (!mapsiteId && mapsiteByCode?.id) mapsiteId = mapsiteByCode.id;

  let bookRows = books ?? [];
  if (bookRows.length === 0 && mapsiteId) {
    const { data: byMapsite } = await supabase
      .from("talisbooks_books")
      .select("*")
      .eq("mapsite_id", mapsiteId)
      .order("updated_at", { ascending: false });
    bookRows = byMapsite ?? [];
  }

  const wantedSlug = options?.bookSlug?.trim() || "";
  if (wantedSlug) {
    const already = bookRows.some((row) => row.slug === wantedSlug);
    if (!already) {
      const { data: bySlug } = await supabase
        .from("talisbooks_books")
        .select("*")
        .eq("slug", wantedSlug)
        .maybeSingle();
      if (bySlug) bookRows = [bySlug, ...bookRows];
    } else {
      bookRows = [
        ...bookRows.filter((row) => row.slug === wantedSlug),
        ...bookRows.filter((row) => row.slug !== wantedSlug),
      ];
    }
  }

  const paymentReceived = await hasCompletedMapSiteActivationPayment({
    email: mapsiteByCode?.email,
    mapsiteId,
    fastCode,
    requestId,
  });

  const primaryRow = bookRows[0]
    ? {
        ...bookRows[0],
        metadata: (bookRows[0].metadata as Record<string, unknown>) ?? {},
      }
    : null;

  let listingImageUrls = listingImageUrlsFromEbookPages(
    listingImageUrlsFromMetadata(primaryRow?.metadata ?? null).map((url) => ({
      spreadImageUrl: url,
    })),
  );
  if (listingImageUrls.length === 0 && primaryRow?.slug) {
    listingImageUrls = await resolveEbookListingImageUrls({
      bookSlug: primaryRow.slug,
    });
  }
  if (listingImageUrls.length === 0 && primaryRow?.id) {
    listingImageUrls = await loadListingImagesFromBookPages(primaryRow.id);
  }

  return {
    fastCode,
    mapsiteId,
    accountType,
    audience,
    paymentReceived,
    registrationHref: buildClaimedMapSitePath({
      fastCode,
      audience,
      accountType,
    }),
    books: bookRows.map((row, index) =>
      toLibraryBook(
        {
          ...row,
          metadata: (row.metadata as Record<string, unknown>) ?? {},
        },
        index
      )
    ),
    primaryEbook: toDraft(primaryRow, listingImageUrls),
  };
}

async function ensureStarterPages(input: {
  bookId: string;
  title: string;
  subtitle: string;
  description: string;
  coverImageUrl: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { count } = await supabase
    .from("talisbooks_book_pages")
    .select("id", { count: "exact", head: true })
    .eq("book_id", input.bookId);

  if ((count ?? 0) > 0) return;

  const now = new Date().toISOString();

  await supabase.from("talisbooks_book_pages").insert([
    {
      book_id: input.bookId,
      title: input.title,
      slug: "cover",
      page_number: 1,
      sort_order: 1,
      content: {
        pageRole: "cover",
        layout: "cover",
        title: input.title,
        subtitle: input.subtitle,
        heroImageUrl: input.coverImageUrl,
      },
      is_visible: true,
      created_at: now,
      updated_at: now,
    },
    {
      book_id: input.bookId,
      title: "About",
      slug: "about",
      page_number: 2,
      sort_order: 2,
      content: {
        pageRole: "property_content",
        layout: "caption",
        title: input.subtitle || input.title,
        body: input.description,
        heroImageUrl: input.coverImageUrl,
      },
      is_visible: true,
      created_at: now,
      updated_at: now,
    },
    {
      book_id: input.bookId,
      title: "Details",
      slug: "details",
      page_number: 3,
      sort_order: 3,
      content: {
        pageRole: "property_content",
        layout: "caption",
        title: "Property story",
        body: input.description,
      },
      is_visible: true,
      created_at: now,
      updated_at: now,
    },
    ...createGlasshouseBrochureDbRows({
      bookId: input.bookId,
      startPageNumber: 4,
      now,
    }).map((row) => ({
      ...row,
      book_id: input.bookId,
    })),
    {
      book_id: input.bookId,
      title: input.title,
      slug: "back-cover",
      page_number: 6,
      sort_order: 6,
      content: {
        pageRole: "cover",
        layout: "cover",
        title: input.title,
        subtitle: input.subtitle,
        body: `TEB™ ebook for FAST Code ${input.title}.`,
        heroImageUrl: input.coverImageUrl,
      },
      is_visible: true,
      created_at: now,
      updated_at: now,
    },
  ]);
}

export async function upsertMapSiteEbook(input: {
  fastCode: string;
  title: string;
  subtitle?: string;
  description?: string;
  coverImageUrl?: string | null;
  /**
   * Legacy client flag — payment capture logic is unchanged elsewhere.
   * Admin passes false to skip client entitlement soft-gates via asAdmin paths.
   * First draft create is allowed without payment; publishing stays activation-gated.
   */
  requirePayment?: boolean;
  /** Marketing / platform admin bypass for entitlement locks. */
  asAdmin?: boolean;
}): Promise<
  | { success: true; bookId: string; slug: string; registrationHref?: undefined }
  | { success: false; error: string; registrationHref?: string }
> {
  const fastCode = input.fastCode.trim().toLowerCase();
  const title = input.title.trim();
  if (!fastCode) return { success: false, error: "FAST Code is required." };
  if (!title) return { success: false, error: "Ebook title is required." };
  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Database is not configured." };
  }

  const context = await getMapSiteEbookContext(fastCode);
  if (!context) return { success: false, error: "Mapsite™ FAST Code not found." };

  const entitlements = await getTalisBooksEntitlementSnapshot(fastCode);
  const existing = context.primaryEbook;
  const isCreate = !existing;

  if (!input.asAdmin && entitlements) {
    if (isCreate) {
      const createGate = assertTalisBooksFeature(
        entitlements,
        entitlements.bookCount === 0
          ? "create_first_draft"
          : "create_additional_book",
      );
      if (!createGate.ok) {
        return {
          success: false,
          error: createGate.error,
          registrationHref: createGate.registrationHref,
        };
      }
    }

    // Keep legacy payment CTA behavior for multi-book clients who still
    // expect checkout messaging — but never block the free first draft.
    if (
      input.requirePayment !== false &&
      !context.paymentReceived &&
      !isCreate &&
      entitlements.bookCount >= 1 &&
      !entitlements.activated
    ) {
      return {
        success: false,
        error: "Activate your account to manage additional Talisbooks™ features.",
        registrationHref: context.registrationHref,
      };
    }
  }

  const supabase = getSupabaseAdmin();
  const existingLibrary = context.books[0] ?? null;
  const baseSlug = slugify(`${fastCode}-${title}`) || `${fastCode}-teb`;
  const slug = existing?.slug || baseSlug;
  const now = new Date().toISOString();
  const subtitle =
    input.subtitle?.trim() || existing?.subtitle || `${fastCode.toUpperCase()} TEB™`;
  const description =
    input.description?.trim() ||
    existing?.description ||
    `Talisbooks™ ebook for Mapsite™ FAST Code ${fastCode.toUpperCase()}.`;
  const coverImageUrl =
    input.coverImageUrl !== undefined
      ? input.coverImageUrl?.trim() || null
      : existing?.coverImageUrl ?? null;

  const existingMetadata =
    (existing
      ? (
          await supabase
            .from("talisbooks_books")
            .select("metadata")
            .eq("id", existing.id)
            .maybeSingle()
        ).data?.metadata
      : null) ?? {};

  const allowPublish =
    input.asAdmin || Boolean(entitlements?.canPublish) || Boolean(entitlements?.activated);
  const allowGlobal =
    input.asAdmin || Boolean(entitlements?.canGlobalMarket);

  const payload = {
    slug,
    title,
    subtitle,
    description,
    publish_status: allowPublish ? "published" : "draft",
    published_at: allowPublish ? now : null,
    page_count: Math.max(existingLibrary?.pageCount ?? 4, 4),
    is_public: allowPublish && allowGlobal,
    mapsite_id: context.mapsiteId,
    fast_code: fastCode,
    account_type: context.accountType,
    metadata: {
      ...(typeof existingMetadata === "object" && existingMetadata
        ? (existingMetadata as Record<string, unknown>)
        : {}),
      coverImageUrl,
      source: "mapsite-teb",
      globallyPublished: allowPublish && allowGlobal,
      activationGated: !allowPublish,
    },
    updated_at: now,
  };

  if (existing) {
    const { data, error } = await supabase
      .from("talisbooks_books")
      .update(payload)
      .eq("id", existing.id)
      .select("id, slug")
      .maybeSingle();
    if (error || !data) {
      return { success: false, error: error?.message || "Failed to update ebook." };
    }
    await ensureStarterPages({
      bookId: data.id,
      title,
      subtitle,
      description,
      coverImageUrl,
    });
    return { success: true, bookId: data.id, slug: data.slug };
  }

  const { data, error } = await supabase
    .from("talisbooks_books")
    .insert({
      ...payload,
      created_at: now,
    })
    .select("id, slug")
    .maybeSingle();

  if (error || !data) {
    return { success: false, error: error?.message || "Failed to create ebook." };
  }

  await ensureStarterPages({
    bookId: data.id,
    title,
    subtitle,
    description,
    coverImageUrl,
  });

  return { success: true, bookId: data.id, slug: data.slug };
}
