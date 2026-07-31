import sharp from "sharp";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { ROUTES } from "@/lib/routes";
import type { TalisBooksLayoutImageRef } from "@/lib/talisbooks/layout-engine/types";
import { TALISBOOKS_IMAGE_STORAGE_BUCKET } from "@/lib/talisbooks/image-engine";
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
      upsert: false,
    });

  if (!primary.error) {
    return (
      supabase.storage.from(TALISBOOKS_IMAGE_STORAGE_BUCKET).getPublicUrl(path)
        .data.publicUrl || null
    );
  }

  const fallback = await supabase.storage.from("mapsite-assets").upload(path, options.buffer, {
    contentType: options.mimeType,
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
  const landscapes: SelfServiceLandscapeAsset[] = [];
  const galleryUrls: string[] = [];
  let coverImageUrl: string | null = null;
  let firstPortraitUrl: string | null = null;

  for (let i = 0; i < options.files.length; i += 1) {
    const file = options.files[i]!;
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/jpeg";
    const imageId = crypto.randomUUID();

    let width = 1600;
    let height = 1200;
    try {
      const meta = await sharp(buffer).metadata();
      if (meta.width && meta.height) {
        width = meta.width;
        height = meta.height;
      }
    } catch {
      // Keep defaults if metadata fails.
    }

    const originalUrl = await uploadBuffer({
      scope: options.scope,
      id: imageId,
      suffix: "original",
      buffer,
      mimeType,
    });
    if (!originalUrl) continue;

    galleryUrls.push(originalUrl);
    if (!coverImageUrl) coverImageUrl = originalUrl;

    if (isSelfServiceSpreadCandidate(width, height)) {
      if (landscapes.length < SELF_SERVICE_MAX_LANDSCAPE_SPREADS) {
        landscapes.push({ url: originalUrl, width, height });
      }
      // Extra landscapes beyond the 22-page budget are ignored.
      continue;
    }

    if (!firstPortraitUrl) firstPortraitUrl = originalUrl;
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
  const refs: TalisBooksLayoutImageRef[] = [];
  const galleryUrls: string[] = [];
  let coverImageUrl: string | null = null;

  for (let i = 0; i < options.files.length; i += 1) {
    const file = options.files[i]!;
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/jpeg";
    const imageId = crypto.randomUUID();

    let width = 1600;
    let height = 1200;
    try {
      const meta = await sharp(buffer).metadata();
      if (meta.width && meta.height) {
        width = meta.width;
        height = meta.height;
      }
    } catch {
      // Keep defaults if metadata fails.
    }

    const originalUrl = await uploadBuffer({
      scope: options.scope,
      id: imageId,
      suffix: "exact",
      buffer,
      mimeType,
    });
    if (!originalUrl) continue;

    galleryUrls.push(originalUrl);
    if (!coverImageUrl) coverImageUrl = originalUrl;

    refs.push({
      id: imageId,
      url: originalUrl,
      width,
      height,
      altText: `${options.altPrefix} page ${i + 1}`,
      mediaKind: "image",
      role: "original",
    });
  }

  return { refs, coverImageUrl, galleryUrls };
}

async function loadSelfServiceAgentDetails(
  mapsiteId: string | null,
): Promise<SelfServiceAgentDetails> {
  const fallback: SelfServiceAgentDetails = {
    name: "Listing contact",
    title: "MapSite™ owner",
    brokerageName: "Talispros™",
  };

  if (!mapsiteId || !isSupabaseAdminConfigured()) {
    return fallback;
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("mapsites")
    .select(
      "owner_first_name, owner_last_name, email, phone, agent_name, profile_image_url, property_address",
    )
    .eq("id", mapsiteId)
    .maybeSingle();

  if (!data) return fallback;

  const ownerName = [data.owner_first_name, data.owner_last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    name: (data.agent_name || ownerName || fallback.name).trim(),
    title: data.agent_name ? "Listing agent" : "Property owner",
    phone: data.phone || undefined,
    email: data.email || undefined,
    photoUrl: data.profile_image_url || undefined,
    brokerageName: "Talispros™",
    brokerageLine: data.property_address || undefined,
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

  const entitlements = await getTalisBooksEntitlementSnapshot(fastCode);
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

  const context = await getMapSiteEbookContext(fastCode);
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

  const { landscapes, coverImageUrl, galleryUrls } =
    await processUploadsForSelfServiceSpreads({
      scope: fastCode,
      files: input.images,
      altPrefix: title,
    });

  if (!coverImageUrl && landscapes.length === 0) {
    return {
      success: false,
      error: "Could not process property images. Try JPG or PNG files.",
    };
  }

  const agent = await loadSelfServiceAgentDetails(mapsiteId);
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
