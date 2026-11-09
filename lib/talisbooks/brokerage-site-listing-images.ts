import "server-only";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { optimizeUploadImage } from "@/lib/media/optimize-upload-image";
import {
  TALISBOOKS_ASSET_CACHE_CONTROL,
  TALISBOOKS_IMAGE_STORAGE_BUCKET,
} from "@/lib/talisbooks/image-engine";
import { isDemoMapSiteCode } from "@/lib/talispros/demo-mapsite";
import { toPlatformStatus } from "@/lib/talispros/mapsite-state";
import { hasCompletedMapSiteActivationPayment } from "@/lib/talispros/mapsite-payment";
import {
  BROKERAGE_SITE_IMAGE_MIN_EDGE_PX,
  NO_BROKERAGE_LISTING_IMAGES_MESSAGE,
  bytesReferenceBlockedListingSource,
  descriptionReferencesBlockedListingSource,
  extractBrokerageSiteImageRefs,
  extractSameSiteContentLinks,
  isBlockedListingUrl,
  resolveBrokerageWebsiteUrl,
  resolveSystemEbookListingImages,
  stripRealtorCreditText,
  type BrokerageSiteImageRef,
  type ListingImageAsset,
} from "@/lib/talisbooks/blocked-listing-sources";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_HTML_CHARS = 1_500_000;
const MAX_IMAGE_BYTES = 12_000_000;
const MIN_IMAGE_BYTES = 4_000;
const DEFAULT_MAX_IMAGES = 8;
const USER_AGENT =
  "Mozilla/5.0 (compatible; TalisprosEbookImages/1.0; +https://www.talispros.com)";

export type BrokerageSiteImageDeps = {
  fetchText?: (url: string) => Promise<{ html: string; finalUrl: string } | null>;
  fetchImage?: (
    url: string,
  ) => Promise<{ buffer: Buffer; contentType: string } | null>;
  probeImage?: (
    buffer: Buffer,
  ) => Promise<{ width: number; height: number } | null>;
  uploadImage?: (input: {
    fastCode: string;
    buffer: Buffer;
    width: number;
    height: number;
  }) => Promise<ListingImageAsset | null>;
};

function withTimeout(ms: number): { signal: AbortSignal; done: () => void } {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(timer) };
}

async function defaultFetchText(
  url: string,
): Promise<{ html: string; finalUrl: string } | null> {
  const { signal, done } = withTimeout(FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal,
      redirect: "follow",
      cache: "no-store",
      headers: { "user-agent": USER_AGENT, accept: "text/html" },
    });
    if (!response.ok) return null;
    const finalUrl = response.url || url;
    if (isBlockedListingUrl(finalUrl)) return null;
    const html = (await response.text()).slice(0, MAX_HTML_CHARS);
    return { html, finalUrl };
  } catch {
    return null;
  } finally {
    done();
  }
}

async function defaultFetchImage(
  url: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (isBlockedListingUrl(url)) return null;
  const { signal, done } = withTimeout(FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal,
      redirect: "follow",
      cache: "no-store",
      headers: { "user-agent": USER_AGENT, accept: "image/*" },
    });
    if (!response.ok) return null;
    if (isBlockedListingUrl(response.url || url)) return null;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) return null;
    if (/svg|gif|icon/i.test(contentType)) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < MIN_IMAGE_BYTES || buffer.length > MAX_IMAGE_BYTES) return null;
    return { buffer, contentType };
  } catch {
    return null;
  } finally {
    done();
  }
}

async function defaultProbeImage(
  buffer: Buffer,
): Promise<{ width: number; height: number } | null> {
  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(buffer, { failOn: "none" }).metadata();
    if (!meta.width || !meta.height) return null;
    return { width: meta.width, height: meta.height };
  } catch {
    return null;
  }
}

async function uploadBrokerageBuffer(input: {
  fastCode: string;
  buffer: Buffer;
  mimeType: string;
}): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const ext =
    input.mimeType === "image/png" ? "png" : input.mimeType === "image/webp" ? "webp" : "jpg";
  const code = input.fastCode.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "") || "code";
  const path = `brokerage-site/${code}/${crypto.randomUUID()}.${ext}`;
  const supabase = getSupabaseAdmin();
  const primary = await supabase.storage
    .from(TALISBOOKS_IMAGE_STORAGE_BUCKET)
    .upload(path, input.buffer, {
      contentType: input.mimeType,
      cacheControl: TALISBOOKS_ASSET_CACHE_CONTROL,
      upsert: false,
    });
  if (!primary.error) {
    return (
      supabase.storage.from(TALISBOOKS_IMAGE_STORAGE_BUCKET).getPublicUrl(path).data
        .publicUrl || null
    );
  }
  const missingBucket = /bucket|not found|does not exist/i.test(primary.error.message || "");
  if (!missingBucket) {
    console.error("[brokerage-site-images] Upload failed:", primary.error.message);
    return null;
  }
  const fallback = await supabase.storage.from("mapsite-assets").upload(path, input.buffer, {
    contentType: input.mimeType,
    cacheControl: TALISBOOKS_ASSET_CACHE_CONTROL,
    upsert: false,
  });
  if (fallback.error) return null;
  return supabase.storage.from("mapsite-assets").getPublicUrl(path).data.publicUrl || null;
}

async function defaultUploadImage(input: {
  fastCode: string;
  buffer: Buffer;
  width: number;
  height: number;
}): Promise<ListingImageAsset | null> {
  try {
    const optimized = await optimizeUploadImage(input.buffer, "property");
    const url = await uploadBrokerageBuffer({
      fastCode: input.fastCode,
      buffer: optimized.buffer,
      mimeType: optimized.mimeType,
    });
    if (!url || isBlockedListingUrl(url)) return null;
    return {
      url,
      width: optimized.width || input.width,
      height: optimized.height || input.height,
    };
  } catch (error) {
    console.warn(
      "[brokerage-site-images] Could not store a brokerage photo:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/**
 * The only fallback image source for system eBooks: photos collected from
 * the Mapsite's brokerage website (og:image, hero, listing, and office).
 * Realtor.ca hosts are dropped. Tiny images, icons, and logos are dropped.
 * Usable files are stored at talisbooks-assets/brokerage-site/{code}/.
 * Returns an empty list when the site has nothing usable.
 */
export async function collectBrokerageSiteListingImages(
  input: {
    fastCode: string;
    websiteUrl: string | null | undefined;
    maxImages?: number;
  },
  deps: BrokerageSiteImageDeps = {},
): Promise<ListingImageAsset[]> {
  const websiteUrl = input.websiteUrl?.trim() || "";
  const fastCode = input.fastCode.trim().toLowerCase();
  if (!websiteUrl || !/^https?:\/\//i.test(websiteUrl) || isBlockedListingUrl(websiteUrl)) {
    console.warn(
      `[brokerage-site-images] ${fastCode || "ebook"}: no brokerage website photos (${websiteUrl ? "blocked or invalid website URL" : "website URL missing"})`,
    );
    return [];
  }

  const fetchText = deps.fetchText ?? defaultFetchText;
  const fetchImage = deps.fetchImage ?? defaultFetchImage;
  const probeImage = deps.probeImage ?? defaultProbeImage;
  const uploadImage = deps.uploadImage ?? defaultUploadImage;
  const maxImages = input.maxImages ?? DEFAULT_MAX_IMAGES;

  const home = await fetchText(websiteUrl);
  if (!home?.html || isBlockedListingUrl(home.finalUrl)) {
    console.warn(
      `[brokerage-site-images] ${fastCode}: could not read brokerage website ${websiteUrl}`,
    );
    return [];
  }

  const pages: Array<{ html: string; finalUrl: string }> = [home];
  for (const link of extractSameSiteContentLinks(home.html, home.finalUrl)) {
    const page = await fetchText(link);
    if (page?.html && !isBlockedListingUrl(page.finalUrl)) pages.push(page);
  }

  const refs: BrokerageSiteImageRef[] = [];
  const seen = new Set<string>();
  for (const page of pages) {
    for (const ref of extractBrokerageSiteImageRefs(page.html, page.finalUrl)) {
      if (seen.has(ref.url) || isBlockedListingUrl(ref.url)) continue;
      seen.add(ref.url);
      refs.push(ref);
    }
  }
  refs.sort((a, b) => a.priority - b.priority);

  const images: ListingImageAsset[] = [];
  for (const ref of refs) {
    if (images.length >= maxImages) break;
    if (
      (ref.width && ref.width < BROKERAGE_SITE_IMAGE_MIN_EDGE_PX) ||
      (ref.height && ref.height < BROKERAGE_SITE_IMAGE_MIN_EDGE_PX)
    ) {
      continue;
    }
    const downloaded = await fetchImage(ref.url);
    if (!downloaded) continue;
    const probed = await probeImage(downloaded.buffer);
    if (
      !probed ||
      probed.width < BROKERAGE_SITE_IMAGE_MIN_EDGE_PX ||
      probed.height < BROKERAGE_SITE_IMAGE_MIN_EDGE_PX
    ) {
      continue;
    }
    const stored = await uploadImage({
      fastCode,
      buffer: downloaded.buffer,
      width: probed.width,
      height: probed.height,
    });
    if (!stored || isBlockedListingUrl(stored.url)) continue;
    images.push(stored);
  }

  if (images.length === 0) {
    console.warn(
      `[brokerage-site-images] ${fastCode}: no usable brokerage website images at ${websiteUrl}`,
    );
  }
  return images;
}

export function isSystemListingEbookBuild(input: {
  isolatedBookshelf?: boolean;
  fastCode?: string | null;
  mapsiteStatus?: string | null;
  paymentReceived?: boolean;
}): boolean {
  if (input.isolatedBookshelf) return false;
  if (isDemoMapSiteCode(input.fastCode)) return false;
  if (input.paymentReceived) return false;
  if (!input.mapsiteStatus?.trim()) return false;
  return toPlatformStatus(input.mapsiteStatus) === "UNCLAIMED";
}

type MapSiteListingRow = {
  id: string;
  status: string | null;
  broker_url: string | null;
  website: string | null;
};

async function loadMapSiteListingRow(input: {
  fastCode: string;
  mapsiteId?: string | null;
}): Promise<MapSiteListingRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = getSupabaseAdmin();
  const columns = "id, status, broker_url, website";
  if (input.mapsiteId?.trim()) {
    const { data } = await supabase
      .from("mapsites")
      .select(columns)
      .eq("id", input.mapsiteId.trim())
      .maybeSingle();
    if (data) return data as MapSiteListingRow;
  }
  const { data } = await supabase
    .from("mapsites")
    .select(columns)
    .eq("fast_code", input.fastCode)
    .maybeSingle();
  return (data as MapSiteListingRow | null) ?? null;
}

export async function resolveEbookListingImages(input: {
  fastCode: string;
  mapsiteId?: string | null;
  isolatedBookshelf?: boolean;
  replaceBookId?: string | null;
  uploadMode?: "images" | "pdf" | null;
  description?: string | null;
  brokerageSitePhotos?: boolean;
  optimizedImages?: ListingImageAsset[];
  pdfBytes?: Uint8Array[];
  deps?: BrokerageSiteImageDeps;
}): Promise<
  | {
      action: "use";
      images: ListingImageAsset[];
      systemListingBuild: boolean;
      replacedWithBrokerage: boolean;
    }
  | {
      action: "unchanged";
      bookId: string;
      slug: string;
      pageCount: number;
      systemListingBuild: true;
    }
  | { action: "blocked"; error: string; systemListingBuild: true }
> {
  const fastCode = input.fastCode.trim().toLowerCase();
  const incoming = input.optimizedImages ?? [];
  const mapsite = await loadMapSiteListingRow({
    fastCode,
    mapsiteId: input.mapsiteId,
  });
  let paymentReceived = false;
  if (mapsite && toPlatformStatus(mapsite.status) === "UNCLAIMED") {
    paymentReceived = await hasCompletedMapSiteActivationPayment({
      fastCode,
      mapsiteId: mapsite.id,
      reconcileFromStripe: false,
    });
  }
  const systemListingBuild = isSystemListingEbookBuild({
    isolatedBookshelf: input.isolatedBookshelf,
    fastCode,
    mapsiteStatus: mapsite?.status,
    paymentReceived,
  });
  const pdfBlocked = (input.pdfBytes ?? []).some((bytes) =>
    bytesReferenceBlockedListingSource(bytes),
  );
  const blockedIncoming = incoming.some((image) => isBlockedListingUrl(image.url));
  const replaceRealtorSources =
    systemListingBuild &&
    (Boolean(input.brokerageSitePhotos) ||
      pdfBlocked ||
      blockedIncoming ||
      (input.uploadMode === "pdf" &&
        descriptionReferencesBlockedListingSource(input.description)));

  if (!replaceRealtorSources) {
    const images = incoming.filter((image) => !isBlockedListingUrl(image.url));
    return {
      action: "use",
      images,
      systemListingBuild,
      replacedWithBrokerage: false,
    };
  }

  const websiteUrl = resolveBrokerageWebsiteUrl(mapsite?.broker_url, mapsite?.website);
  const brokerage = await collectBrokerageSiteListingImages(
    { fastCode, websiteUrl },
    input.deps,
  );
  let existing: ListingImageAsset[] = [];
  let existingBook: { id: string; slug: string; page_count: number | null } | null = null;
  const replaceId = input.replaceBookId?.trim() || "";
  if (replaceId && isSupabaseAdminConfigured()) {
    const { data } = await getSupabaseAdmin()
      .from("talisbooks_books")
      .select("id, slug, page_count")
      .eq("id", replaceId)
      .maybeSingle();
    if (data?.id && data.slug) {
      existingBook = data;
      existing = [{ url: "existing", width: 1, height: 1 }];
    }
  }

  const resolved = resolveSystemEbookListingImages({
    incoming,
    brokerage,
    existing,
    replaceRealtorSources: true,
  });

  if (resolved.action === "brokerage") {
    return {
      action: "use",
      images: resolved.images,
      systemListingBuild: true,
      replacedWithBrokerage: true,
    };
  }

  if (resolved.action === "unchanged" && existingBook) {
    console.warn(
      `[system-ebook] ${fastCode}: no usable brokerage website images; left existing ebook images unchanged`,
    );
    return {
      action: "unchanged",
      bookId: existingBook.id,
      slug: existingBook.slug,
      pageCount: existingBook.page_count ?? 0,
      systemListingBuild: true,
    };
  }

  console.warn(
    `[system-ebook] ${fastCode}: no usable brokerage website images; did not store blocked listing photos`,
  );
  return {
    action: "blocked",
    error: NO_BROKERAGE_LISTING_IMAGES_MESSAGE,
    systemListingBuild: true,
  };
}

export async function stripStoredEbookCreditText(bookId: string): Promise<void> {
  if (!bookId || !isSupabaseAdminConfigured()) return;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("talisbooks_books")
    .select("id, description, metadata")
    .eq("id", bookId)
    .maybeSingle();
  if (!data) return;
  const description = stripRealtorCreditText(data.description || "");
  const metadata =
    data.metadata && typeof data.metadata === "object"
      ? stripCreditMetadata(data.metadata as Record<string, unknown>)
      : data.metadata;
  if (description === (data.description || "") && metadata === data.metadata) return;
  await supabase
    .from("talisbooks_books")
    .update({
      description,
      metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookId);
}

function stripCreditMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...metadata };
  for (const key of ["description", "metaDescription", "seoDescription", "subtitle"]) {
    if (typeof next[key] === "string") {
      next[key] = stripRealtorCreditText(next[key]);
    }
  }
  return next;
}

/**
 * When a system FAST Code's listings change, refresh its eBook from the
 * brokerage website only. If that site has no usable photos, the book is
 * left as it was.
 */
export async function refreshSystemEbookFromBrokerageWebsite(input: {
  fastCode: string;
  mapsiteId?: string | null;
  brokerUrl?: string | null;
  website?: string | null;
  deps?: BrokerageSiteImageDeps;
}): Promise<{ updated: boolean; imageCount: number }> {
  const fastCode = input.fastCode.trim().toLowerCase();
  const websiteUrl = resolveBrokerageWebsiteUrl(input.brokerUrl, input.website);
  const images = await collectBrokerageSiteListingImages(
    { fastCode, websiteUrl },
    input.deps,
  );
  if (images.length === 0 || !isSupabaseAdminConfigured()) {
    console.warn(
      `[system-ebook] ${fastCode}: no usable brokerage website images; left existing ebook images unchanged`,
    );
    return { updated: false, imageCount: 0 };
  }

  const supabase = getSupabaseAdmin();
  const urls = images.map((image) => image.url).filter((url) => !isBlockedListingUrl(url));
  if (urls.length === 0) {
    console.warn(
      `[system-ebook] ${fastCode}: brokerage image URLs were blocked; left existing ebook images unchanged`,
    );
    return { updated: false, imageCount: 0 };
  }

  if (input.mapsiteId) {
    await supabase
      .from("mapsites")
      .update({
        cover_image: urls[0],
        header_image_url: urls[0],
        gallery_images: urls,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.mapsiteId);
  }

  const { data: books } = await supabase
    .from("talisbooks_books")
    .select("id, description, metadata")
    .eq("fast_code", fastCode)
    .order("created_at", { ascending: false })
    .limit(5);
  const book = (books ?? []).find((row) => {
    const metadata = row.metadata;
    return Boolean(
      metadata &&
        typeof metadata === "object" &&
        (metadata as { autoGenerated?: boolean }).autoGenerated === true,
    );
  });
  if (!book) return { updated: true, imageCount: urls.length };

  const metadata =
    book.metadata && typeof book.metadata === "object"
      ? { ...(book.metadata as Record<string, unknown>) }
      : {};
  metadata.galleryImageUrls = urls;
  metadata.listingImageSource = "brokerage-website";
  if (typeof metadata.coverImageUrl === "string" && isBlockedListingUrl(metadata.coverImageUrl)) {
    delete metadata.coverImageUrl;
  }
  if (
    typeof metadata.backCoverImageUrl === "string" &&
    isBlockedListingUrl(metadata.backCoverImageUrl)
  ) {
    delete metadata.backCoverImageUrl;
  }
  const description = stripRealtorCreditText(book.description || "");
  await supabase
    .from("talisbooks_books")
    .update({
      description,
      metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", book.id);

  const { data: pages } = await supabase
    .from("talisbooks_book_pages")
    .select("id, content")
    .eq("book_id", book.id)
    .order("page_number", { ascending: true });
  let imageIndex = 0;
  for (const page of pages ?? []) {
    const content =
      page.content && typeof page.content === "object"
        ? { ...(page.content as Record<string, unknown>) }
        : null;
    if (!content) continue;
    let changed = false;
    if (typeof content.spreadImageUrl === "string") {
      content.spreadImageUrl = urls[imageIndex % urls.length];
      imageIndex += 1;
      changed = true;
    }
    if (typeof content.heroImageUrl === "string" && content.pageRole !== "cover") {
      content.heroImageUrl = urls[imageIndex % urls.length];
      imageIndex += 1;
      changed = true;
    }
    if (!changed) continue;
    await supabase
      .from("talisbooks_book_pages")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", page.id);
  }

  return { updated: true, imageCount: urls.length };
}
