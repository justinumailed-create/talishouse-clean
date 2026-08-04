import sharp from "sharp";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { ROUTES } from "@/lib/routes";
import type { TalisBooksLayoutImageRef } from "@/lib/talisbooks/layout-engine/types";
import {
  TALISBOOKS_ASSET_CACHE_CONTROL,
  TALISBOOKS_IMAGE_STORAGE_BUCKET,
  TALISBOOKS_PAGE_IMAGE_MAX_EDGE_PX,
  TALISBOOKS_PAGE_IMAGE_QUALITY,
} from "@/lib/talisbooks/image-engine";
import { getMapSiteEbookContext } from "@/lib/talisbooks/mapsite-ebook-service";
import {
  assertTalisBooksFeature,
  getTalisBooksEntitlementSnapshot,
} from "@/lib/talisbooks/entitlements";
import {
  buildSelfServiceEbookPageRows,
  isSelfServiceSpreadCandidate,
  SELF_SERVICE_MAX_LANDSCAPE_SPREADS,
  SELF_SERVICE_TOTAL_PAGES,
  type SelfServiceAgentDetails,
  type SelfServiceLandscapeAsset,
} from "@/lib/talisbooks/self-service-page-plan";

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function uniqueSlug(scope: string, title: string): string {
  const base = slugify(`${scope}-${title}`) || `${scope}-teb`;
  const suffix = Date.now().toString(36).slice(-4);
  return `${base}-${suffix}`;
}

/** Keep serverless CPU under control while still overlapping I/O. */
const IMAGE_PROCESS_CONCURRENCY = 3;
/** Agent headshot / logo never need full spread resolution. */
const AGENT_ASSET_MAX_EDGE_PX = 960;

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]!, index);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

async function uploadBuffer(options: {
  scope: string;
  id: string;
  suffix: string;
  buffer: Buffer;
  mimeType: string;
}): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const ext =
    options.mimeType === "image/png"
      ? "png"
      : options.mimeType === "image/webp"
        ? "webp"
        : "jpg";
  const path = `auto-draft/${options.scope}/${options.id}-${options.suffix}.${ext}`;

  const primary = await supabase.storage
    .from(TALISBOOKS_IMAGE_STORAGE_BUCKET)
    .upload(path, options.buffer, {
      contentType: options.mimeType,
      cacheControl: TALISBOOKS_ASSET_CACHE_CONTROL,
      upsert: false,
    });

  if (!primary.error) {
    return (
      supabase.storage.from(TALISBOOKS_IMAGE_STORAGE_BUCKET).getPublicUrl(path)
        .data.publicUrl || null
    );
  }

  // Prefer the primary bucket; only fall back when the bucket is missing.
  const missingBucket =
    /bucket|not found|does not exist/i.test(primary.error.message || "");
  if (!missingBucket) {
    console.error("[auto-draft-ebook] Upload failed:", primary.error.message);
    return null;
  }

  const fallback = await supabase.storage.from("mapsite-assets").upload(path, options.buffer, {
    contentType: options.mimeType,
    cacheControl: TALISBOOKS_ASSET_CACHE_CONTROL,
    upsert: false,
  });
  if (fallback.error) {
    console.error(
      "[auto-draft-ebook] Upload failed:",
      primary.error.message,
      fallback.error.message
    );
    return null;
  }
  return (
    supabase.storage.from("mapsite-assets").getPublicUrl(path).data.publicUrl || null
  );
}

interface PreparedPageImage {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
}

/**
 * Camera uploads run 4–12 MP, which the viewer then downloads in full for every
 * page turn. Bake them down to display size once, at generation time.
 * Prefer fast encodes over maximum compression — generation latency matters.
 */
async function prepareViewerPageImage(
  buffer: Buffer,
  mimeType: string,
  maxEdgePx: number = TALISBOOKS_PAGE_IMAGE_MAX_EDGE_PX
): Promise<PreparedPageImage> {
  try {
    const source = sharp(buffer, { failOn: "none", sequentialRead: true }).rotate();
    const meta = await source.metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (!width || !height) {
      return { buffer, mimeType, width: 1600, height: 1200 };
    }

    const longEdge = Math.max(width, height);
    const scale = Math.min(1, maxEdgePx / longEdge);
    const pipeline =
      scale < 1
        ? source.resize({
            width: Math.round(width * scale),
            height: Math.round(height * scale),
            fit: "inside",
            withoutEnlargement: true,
          })
        : source;

    const keepAlpha = Boolean(meta.hasAlpha) && mimeType !== "image/jpeg";
    const encoded = keepAlpha
      ? await pipeline
          // Level 6 is ~3–5× faster than 9 with nearly the same size.
          .png({ compressionLevel: 6 })
          .toBuffer({ resolveWithObject: true })
      : await pipeline
          .jpeg({
            quality: TALISBOOKS_PAGE_IMAGE_QUALITY,
            // mozjpeg/progressive are much slower on serverless CPUs.
            mozjpeg: false,
            progressive: false,
          })
          .toBuffer({ resolveWithObject: true });

    // A tiny source can encode larger than it started; keep whichever is smaller.
    if (encoded.data.byteLength >= buffer.byteLength && scale === 1) {
      return { buffer, mimeType, width, height };
    }

    return {
      buffer: encoded.data,
      mimeType: keepAlpha ? "image/png" : "image/jpeg",
      width: encoded.info.width,
      height: encoded.info.height,
    };
  } catch {
    return { buffer, mimeType, width: 1600, height: 1200 };
  }
}

/**
 * Upload originals for self-service books.
 * Landscapes (width > height) become continuous facing spreads — full URL kept.
 * Extra landscapes beyond the 22-page budget are ignored.
 * Portraits are ignored for page placement (may still seed cover fallback).
 */
async function processUploadsForSelfServiceSpreads(options: {
  scope: string;
  files: File[];
  altPrefix: string;
}): Promise<{
  landscapes: SelfServiceLandscapeAsset[];
  coverImageUrl: string | null;
  galleryUrls: string[];
}> {
  const processed = await mapWithConcurrency(
    options.files,
    IMAGE_PROCESS_CONCURRENCY,
    async (file) => {
      const source = Buffer.from(await file.arrayBuffer());
      const prepared = await prepareViewerPageImage(
        source,
        file.type || "image/jpeg"
      );
      const imageId = crypto.randomUUID();
      const originalUrl = await uploadBuffer({
        scope: options.scope,
        id: imageId,
        suffix: "original",
        buffer: prepared.buffer,
        mimeType: prepared.mimeType,
      });
      if (!originalUrl) return null;
      return {
        url: originalUrl,
        width: prepared.width,
        height: prepared.height,
      };
    }
  );

  const landscapes: SelfServiceLandscapeAsset[] = [];
  const galleryUrls: string[] = [];
  let coverImageUrl: string | null = null;
  let firstPortraitUrl: string | null = null;

  for (const item of processed) {
    if (!item) continue;
    galleryUrls.push(item.url);
    if (!coverImageUrl) coverImageUrl = item.url;

    if (isSelfServiceSpreadCandidate(item.width, item.height)) {
      if (landscapes.length < SELF_SERVICE_MAX_LANDSCAPE_SPREADS) {
        landscapes.push(item);
      }
      continue;
    }

    if (!firstPortraitUrl) firstPortraitUrl = item.url;
  }

  if (!coverImageUrl) {
    coverImageUrl = landscapes[0]?.url ?? firstPortraitUrl;
  }

  return { landscapes, coverImageUrl, galleryUrls };
}

/**
 * Exact PDF (or raster) pages: upload as-is, no landscape split / layout engine.
 */
async function processUploadsAsExactPages(options: {
  scope: string;
  files: File[];
  altPrefix: string;
}): Promise<{
  refs: TalisBooksLayoutImageRef[];
  coverImageUrl: string | null;
  galleryUrls: string[];
}> {
  const processed = await mapWithConcurrency(
    options.files,
    IMAGE_PROCESS_CONCURRENCY,
    async (file, i) => {
      const source = Buffer.from(await file.arrayBuffer());
      const prepared = await prepareViewerPageImage(
        source,
        file.type || "image/jpeg"
      );
      const imageId = crypto.randomUUID();
      const originalUrl = await uploadBuffer({
        scope: options.scope,
        id: imageId,
        suffix: "exact",
        buffer: prepared.buffer,
        mimeType: prepared.mimeType,
      });
      if (!originalUrl) return null;
      return {
        id: imageId,
        url: originalUrl,
        width: prepared.width,
        height: prepared.height,
        altText: `${options.altPrefix} page ${i + 1}`,
        mediaKind: "image" as const,
        role: "original" as const,
      };
    }
  );

  const refs: TalisBooksLayoutImageRef[] = [];
  const galleryUrls: string[] = [];
  let coverImageUrl: string | null = null;

  for (const ref of processed) {
    if (!ref) continue;
    refs.push(ref);
    galleryUrls.push(ref.url);
    if (!coverImageUrl) coverImageUrl = ref.url;
  }

  return { refs, coverImageUrl, galleryUrls };
}

async function uploadOptionalAgentImage(options: {
  fastCode: string;
  file: File | null | undefined;
  suffix: string;
}): Promise<string | undefined> {
  const file = options.file;
  if (!file || file.size === 0) return undefined;
  const source = Buffer.from(await file.arrayBuffer());
  const prepared = await prepareViewerPageImage(
    source,
    file.type || "image/jpeg",
    AGENT_ASSET_MAX_EDGE_PX
  );
  const url = await uploadBuffer({
    scope: options.fastCode,
    id: crypto.randomUUID(),
    suffix: options.suffix,
    buffer: prepared.buffer,
    mimeType: prepared.mimeType,
  });
  return url || undefined;
}

async function loadSelfServiceAgentDetails(input: {
  fastCode: string;
  requestId: string | null;
  mapsiteId: string | null;
  agentName?: string | null;
  agentEmail?: string | null;
  agentPhone?: string | null;
  agentPhoto?: File | null;
  brokerageLogo?: File | null;
}): Promise<SelfServiceAgentDetails> {
  const fallback: SelfServiceAgentDetails = {
    name: "Listing contact",
    title: "MapSite™ owner",
    brokerageName: "Talispros™",
  };

  const overrides = {
    name: input.agentName?.trim() || "",
    email: input.agentEmail?.trim() || "",
    phone: input.agentPhone?.trim() || "",
  };

  // Upload agent assets in parallel with DB lookups.
  const [uploadedPhotoUrl, uploadedLogoUrl] = await Promise.all([
    uploadOptionalAgentImage({
      fastCode: input.fastCode,
      file: input.agentPhoto,
      suffix: "agent-photo",
    }),
    uploadOptionalAgentImage({
      fastCode: input.fastCode,
      file: input.brokerageLogo,
      suffix: "brokerage-logo",
    }),
  ]);

  if (!isSupabaseAdminConfigured()) {
    return {
      ...fallback,
      name: overrides.name || fallback.name,
      email: overrides.email || undefined,
      phone: overrides.phone || undefined,
      photoUrl: uploadedPhotoUrl,
      brokerageLogoUrl: uploadedLogoUrl,
    };
  }

  const supabase = getSupabaseAdmin();
  let request: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    logo: string | null;
    linked_mapsite_id: string | null;
  } | null = null;

  if (input.requestId) {
    const byId = await supabase
      .from("build_requests")
      .select("id, first_name, last_name, email, phone, logo, linked_mapsite_id")
      .eq("id", input.requestId)
      .maybeSingle();
    request = byId.data;
  }

  if (!request && input.fastCode) {
    const byFastCode = await supabase
      .from("build_requests")
      .select("id, first_name, last_name, email, phone, logo, linked_mapsite_id")
      .ilike("requested_fast_code", input.fastCode)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    request = byFastCode.data;
  }

  const resolvedMapsiteId = input.mapsiteId || request?.linked_mapsite_id || null;

  const [mapsiteResult, assetsResult] = await Promise.all([
    resolvedMapsiteId
      ? supabase
          .from("mapsites")
          .select(
            "owner_first_name, owner_last_name, email, phone, agent_name, profile_image_url, logo_url, property_address",
          )
          .eq("id", resolvedMapsiteId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    request?.id
      ? supabase
          .from("mapsite_assets")
          .select("profile_image, logo_image")
          .eq("request_id", request.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const mapsite = mapsiteResult.data;
  const assets = assetsResult.data;

  const requestName = [request?.first_name, request?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const ownerName = [mapsite?.owner_first_name, mapsite?.owner_last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    name:
      overrides.name ||
      mapsite?.agent_name?.trim() ||
      requestName ||
      ownerName ||
      fallback.name,
    title: mapsite?.agent_name ? "Listing agent" : "Property owner",
    phone: overrides.phone || request?.phone || mapsite?.phone || undefined,
    email: overrides.email || request?.email || mapsite?.email || undefined,
    photoUrl:
      uploadedPhotoUrl ||
      assets?.profile_image ||
      mapsite?.profile_image_url ||
      undefined,
    brokerageName: "Talispros™",
    brokerageLine: mapsite?.property_address || undefined,
    brokerageLogoUrl:
      uploadedLogoUrl || request?.logo || assets?.logo_image || mapsite?.logo_url || undefined,
  };
}

export type AutoDraftUploadMode = "images" | "pdf";

export type AutoDraftEbookInput = {
  fastCode: string;
  mapsiteId?: string | null;
  accountType?: string | null;
  requestId?: string | null;
  title: string;
  description?: string | null;
  location?: string | null;
  agentName?: string | null;
  agentEmail?: string | null;
  agentPhone?: string | null;
  brokerageLogo?: File | null;
  agentPhoto?: File | null;
  images: File[];
  /** Provenance tag stored in metadata.source */
  source?: string;
  /**
   * `pdf` = exact page rasters in the viewer (no cover/Glasshouse/layout rules).
   * `images` = fixed 22-page self-service landscape spread plan.
   */
  uploadMode?: AutoDraftUploadMode;
};

export type AutoDraftEbookResult =
  | {
      success: true;
      bookId: string;
      slug: string;
      previewUrl: string;
      pageCount: number;
      mapsiteId: string | null;
    }
  | { success: false; error: string };

/**
 * Automatically generate the first TalisBook™ as a Draft with a preview URL.
 * Self-service images: fixed 22-page plan with continuous landscape spreads.
 * PDF: exact page rasters (no Glasshouse / cover scaffolding).
 */
export async function autoGenerateDraftTalisBook(
  input: AutoDraftEbookInput
): Promise<AutoDraftEbookResult> {
  const fastCode = input.fastCode.trim().toLowerCase();
  const title = input.title.trim() || `${fastCode.toUpperCase()} TalisBook™`;
  const description =
    input.description?.trim() ||
    `Draft TalisBook™ for FAST Code ${fastCode.toUpperCase()}.`;
  const location = input.location?.trim() || "";

  if (!fastCode) return { success: false, error: "FAST Code is required." };
  if (!input.images.length) {
    return { success: false, error: "Upload at least one property image." };
  }
  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Database is not configured." };
  }

  const entitlementsPromise = getTalisBooksEntitlementSnapshot(fastCode);
  // Skip the heavy MapSite context lookup when the form already supplied IDs.
  const contextPromise =
    input.mapsiteId?.trim() && input.accountType?.trim()
      ? Promise.resolve(null)
      : getMapSiteEbookContext(fastCode);

  const [entitlements, context] = await Promise.all([
    entitlementsPromise,
    contextPromise,
  ]);
  if (entitlements) {
    const createGate = assertTalisBooksFeature(
      entitlements,
      entitlements.bookCount === 0 ? "create_first_draft" : "create_additional_book",
    );
    if (!createGate.ok) {
      return { success: false, error: createGate.error };
    }
    if (entitlements.bookCount > 0 && !entitlements.canAdditionalUploads) {
      return {
        success: false,
        error: "Additional uploads unlock after account activation.",
      };
    }
  }

  const mapsiteId = input.mapsiteId?.trim() || context?.mapsiteId || null;
  const accountType =
    input.accountType?.toLowerCase() === "derivative"
      ? "derivative"
      : context?.accountType || "root";

  const exactPdf = input.uploadMode === "pdf";

  if (exactPdf) {
    const { refs, coverImageUrl, galleryUrls } = await processUploadsAsExactPages({
      scope: fastCode,
      files: input.images,
      altPrefix: title,
    });

    if (refs.length === 0 || !coverImageUrl) {
      return {
        success: false,
        error: "Could not process PDF pages. Try exporting as images.",
      };
    }

    const supabase = getSupabaseAdmin();
    const slug = uniqueSlug(fastCode, title);
    const now = new Date().toISOString();
    const pageRows = refs.map((ref, index) => {
      const pageNumber = index + 1;
      return {
        title: `Page ${pageNumber}`,
        slug: `pdf-page-${String(pageNumber).padStart(2, "0")}`,
        page_number: pageNumber,
        sort_order: pageNumber,
        content: {
          pageRole: "property_content",
          layout: "full_bleed",
          // Empty title/body so the renderer shows the raster only (no captions).
          title: "",
          body: "",
          heroImageUrl: ref.url,
          exactPdfPage: true,
          sourcePageIndex: pageNumber,
        },
        is_visible: true,
        created_at: now,
        updated_at: now,
      };
    });

    const pageCount = pageRows.length;
    const previewUrl = `${ROUTES.TALISBOOKS_VIEWER}/${slug}`;

    const { data: book, error: bookError } = await supabase
      .from("talisbooks_books")
      .insert({
        slug,
        title,
        subtitle: location || "PDF",
        description,
        publish_status: "draft",
        published_at: null,
        page_count: pageCount,
        is_public: false,
        mapsite_id: mapsiteId,
        fast_code: fastCode,
        account_type: accountType,
        metadata: {
          coverImageUrl,
          galleryImageUrls: galleryUrls,
          location: location || null,
          source: input.source || "self-service-pdf",
          requestId: input.requestId ?? null,
          globallyPublished: false,
          paymentRequired: false,
          previewUrl,
          autoGenerated: true,
          exactPdfPages: true,
          skipPermanentPages: true,
          landscapeAsSpreads: false,
          portraitPreserved: true,
        },
        created_at: now,
        updated_at: now,
      })
      .select("id, slug")
      .maybeSingle();

    if (bookError || !book) {
      return {
        success: false,
        error: bookError?.message || "Failed to create PDF TalisBook™.",
      };
    }

    const { error: pagesError } = await supabase
      .from("talisbooks_book_pages")
      .insert(pageRows.map((row) => ({ ...row, book_id: book.id })));

    if (pagesError) {
      console.error(
        "[auto-draft-ebook] PDF pages insert failed:",
        pagesError.message
      );
    }

    if (mapsiteId) {
      await supabase
        .from("mapsites")
        .update({
          teb_url: previewUrl,
          updated_at: now,
        })
        .eq("id", mapsiteId);
    }

    return {
      success: true,
      bookId: book.id,
      slug: book.slug,
      previewUrl,
      pageCount,
      mapsiteId,
    };
  }

  const [{ landscapes, coverImageUrl, galleryUrls }, agent] = await Promise.all([
    processUploadsForSelfServiceSpreads({
      scope: fastCode,
      files: input.images,
      altPrefix: title,
    }),
    loadSelfServiceAgentDetails({
      fastCode,
      requestId: input.requestId?.trim() || null,
      mapsiteId,
      agentName: input.agentName,
      agentEmail: input.agentEmail,
      agentPhone: input.agentPhone,
      agentPhoto: input.agentPhoto,
      brokerageLogo: input.brokerageLogo,
    }),
  ]);

  if (!coverImageUrl && landscapes.length === 0) {
    return {
      success: false,
      error: "Could not process property images. Try JPG or PNG files.",
    };
  }

  const planned = buildSelfServiceEbookPageRows({
    title,
    description,
    location,
    landscapes,
    coverImageUrl,
    agent,
  });

  const supabase = getSupabaseAdmin();
  const slug = uniqueSlug(fastCode, title);
  const now = new Date().toISOString();
  const pageRows = planned.map((row) => ({
    ...row,
    is_visible: true,
    created_at: now,
    updated_at: now,
  }));

  const pageCount = SELF_SERVICE_TOTAL_PAGES;
  const previewUrl = `${ROUTES.TALISBOOKS_VIEWER}/${slug}`;

  const { data: book, error: bookError } = await supabase
    .from("talisbooks_books")
    .insert({
      slug,
      title,
      subtitle: location || "Draft",
      description,
      publish_status: "draft",
      published_at: null,
      page_count: pageCount,
      is_public: false,
      mapsite_id: mapsiteId,
      fast_code: fastCode,
      account_type: accountType,
      metadata: {
        coverImageUrl,
        galleryImageUrls: galleryUrls,
        location: location || null,
        source: input.source || "auto-draft-teb",
        requestId: input.requestId ?? null,
        globallyPublished: false,
        paymentRequired: false,
        previewUrl,
        autoGenerated: true,
        // Fixed page plan already embeds Glasshouse at 18–19 — do not re-inject.
        skipPermanentPages: true,
        selfServicePagePlan: true,
        landscapeAsSpreads: true,
        continuousCenterfolds: true,
        portraitPreserved: true,
        landscapeSpreadCount: landscapes.length,
      },
      created_at: now,
      updated_at: now,
    })
    .select("id, slug")
    .maybeSingle();

  if (bookError || !book) {
    return {
      success: false,
      error: bookError?.message || "Failed to create draft TalisBook™.",
    };
  }

  const { error: pagesError } = await supabase
    .from("talisbooks_book_pages")
    .insert(pageRows.map((row) => ({ ...row, book_id: book.id })));

  if (pagesError) {
    console.error("[auto-draft-ebook] Pages insert failed:", pagesError.message);
  }

  if (mapsiteId) {
    await supabase
      .from("mapsites")
      .update({
        teb_url: previewUrl,
        updated_at: now,
      })
      .eq("id", mapsiteId);
  }

  return {
    success: true,
    bookId: book.id,
    slug: book.slug,
    previewUrl,
    pageCount,
    mapsiteId,
  };
}
