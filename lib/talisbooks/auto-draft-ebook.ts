import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { ROUTES } from "@/lib/routes";
import type { TalisBooksLayoutImageRef } from "@/lib/talisbooks/layout-engine/types";
import {
  TALISBOOKS_ASSET_CACHE_CONTROL,
  TALISBOOKS_IMAGE_STORAGE_BUCKET,
} from "@/lib/talisbooks/image-engine";
import { getMapSiteEbookContext } from "@/lib/talisbooks/mapsite-ebook-service";
import {
  assertTalisBooksFeature,
  getTalisBooksEntitlementSnapshot,
} from "@/lib/talisbooks/entitlements";
import {
  assignFacingUploadRoles,
  buildSelfServiceEbookPageRows,
  resolveSelfServiceBookOptions,
  type SelfServiceAgentDetails,
  type SelfServiceBookOptions,
  type SelfServiceLandscapeAsset,
  type SelfServicePageCaption,
} from "@/lib/talisbooks/self-service-page-plan";
import { splitCoverSpreadFromUrl } from "@/lib/talisbooks/cover-spread";
import {
  logOnboardingStep,
  onboardingNow,
} from "@/lib/onboarding-timing";
import { optimizeUploadImage } from "@/lib/media/optimize-upload-image";

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
): Promise<PreparedPageImage> {
  try {
    const optimized = await optimizeUploadImage(buffer, "property");
    return {
      buffer: optimized.buffer,
      mimeType: optimized.mimeType,
      width: optimized.width,
      height: optimized.height,
    };
  } catch {
    return { buffer, mimeType: "image/jpeg", width: 1600, height: 1200 };
  }
}

/**
 * Upload originals for self-service books.
 * Image #1 = cover spread (back | front); remaining = interiors.
 */
async function processUploadsForSelfServiceSpreads(options: {
  scope: string;
  files: File[];
  altPrefix: string;
}): Promise<{
  landscapes: SelfServiceLandscapeAsset[];
  coverSpreadImageUrl: string | null;
  coverImageUrl: string | null;
  backCoverImageUrl: string | null;
  galleryUrls: string[];
}> {
  const processed = await mapWithConcurrency(
    options.files,
    IMAGE_PROCESS_CONCURRENCY,
    async (file) => {
      const source = Buffer.from(await file.arrayBuffer());
      const prepared = await prepareViewerPageImage(
        source,
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

  return assignFacingUploadRoles(
    processed.filter((item): item is NonNullable<typeof item> => Boolean(item)),
  );
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

export type OptimizedEbookImageAsset = {
  url: string;
  width: number;
  height: number;
};

/**
 * Use already-optimized storage URLs (no second encode pass).
 * First image = cover spread; remaining = interiors.
 */
function processOptimizedImageAssets(
  assets: OptimizedEbookImageAsset[],
): {
  landscapes: SelfServiceLandscapeAsset[];
  coverSpreadImageUrl: string | null;
  coverImageUrl: string | null;
  backCoverImageUrl: string | null;
  galleryUrls: string[];
} {
  return assignFacingUploadRoles(assets);
}

async function uploadOptionalAgentImage(options: {
  fastCode: string;
  file: File | null | undefined;
  suffix: string;
}): Promise<string | undefined> {
  const file = options.file;
  if (!file || file.size === 0) return undefined;
  const source = Buffer.from(await file.arrayBuffer());
  const isLogo = options.suffix.includes("logo");
  const prepared = isLogo
    ? await optimizeUploadImage(source, "logo")
    : await optimizeUploadImage(source, "agent");
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
  /** Pre-optimized storage URL — skips File upload. */
  agentPhotoUrl?: string | null;
  brokerageLogoUrl?: string | null;
}): Promise<SelfServiceAgentDetails> {
  const fallback: SelfServiceAgentDetails = {
    name: "Listing contact",
    title: "Mapsite™ owner",
    brokerageName: "Talispros™",
  };

  const overrides = {
    name: input.agentName?.trim() || "",
    email: input.agentEmail?.trim() || "",
    phone: input.agentPhone?.trim() || "",
  };

  const prePhoto = input.agentPhotoUrl?.trim() || "";
  const preLogo = input.brokerageLogoUrl?.trim() || "";

  // Upload agent assets in parallel with DB lookups (unless URLs already provided).
  const [uploadedPhotoUrl, uploadedLogoUrl] = await Promise.all([
    prePhoto
      ? Promise.resolve(prePhoto)
      : uploadOptionalAgentImage({
          fastCode: input.fastCode,
          file: input.agentPhoto,
          suffix: "agent-photo",
        }),
    preLogo
      ? Promise.resolve(preLogo)
      : uploadOptionalAgentImage({
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

  const resolvedMapSiteId = input.mapsiteId || request?.linked_mapsite_id || null;

  const [mapsiteResult, assetsResult] = await Promise.all([
    resolvedMapSiteId
      ? supabase
          .from("mapsites")
          .select(
            "id, owner_first_name, owner_last_name, email, phone, agent_name, profile_image_url, logo_url, property_address",
          )
          .eq("id", resolvedMapSiteId)
          .maybeSingle()
      : input.fastCode
        ? supabase
            .from("mapsites")
            .select(
              "id, owner_first_name, owner_last_name, email, phone, agent_name, profile_image_url, logo_url, property_address",
            )
            .ilike("fast_code", input.fastCode)
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

  const agent: SelfServiceAgentDetails = {
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

  await persistSelfServiceMapSiteBranding({
    mapsiteId: mapsiteResult.data?.id || resolvedMapSiteId,
    fastCode: input.fastCode,
    requestId: request?.id || input.requestId,
    agent,
    uploadedPhoto: Boolean(uploadedPhotoUrl),
    uploadedLogo: Boolean(uploadedLogoUrl),
  });

  return agent;
}

async function persistSelfServiceMapSiteBranding(input: {
  mapsiteId: string | null;
  fastCode: string;
  requestId: string | null | undefined;
  agent: SelfServiceAgentDetails;
  uploadedPhoto: boolean;
  uploadedLogo: boolean;
}): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const photo = input.agent.photoUrl?.trim() || null;
  const logo = input.agent.brokerageLogoUrl?.trim() || null;
  const name = input.agent.name?.trim() || "";
  const email = input.agent.email?.trim() || "";
  const phone = input.agent.phone?.trim() || "";
  const requestId = input.requestId?.trim() || null;
  const fastCode = input.fastCode.trim();
  const shouldWriteMapSite =
    Boolean(input.mapsiteId || fastCode) &&
    (Boolean(photo) ||
      Boolean(logo) ||
      input.uploadedPhoto ||
      input.uploadedLogo ||
      name ||
      email ||
      phone);
  const shouldWriteAssets =
    Boolean(requestId) &&
    (Boolean(photo) || Boolean(logo) || input.uploadedPhoto || input.uploadedLogo);

  if (!shouldWriteMapSite && !shouldWriteAssets) return;

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  if (shouldWriteMapSite) {
    const nameParts = name.split(/\s+/).filter(Boolean);
    const patch: Record<string, unknown> = { updated_at: now };
    if (photo) patch.profile_image_url = photo;
    if (logo) patch.logo_url = logo;
    if (name) {
      patch.agent_name = name;
      if (nameParts.length > 0) patch.owner_first_name = nameParts[0];
      if (nameParts.length > 1) patch.owner_last_name = nameParts.slice(1).join(" ");
    }
    if (email) patch.email = email;
    if (phone) patch.phone = phone;

    const write = input.mapsiteId
      ? supabase.from("mapsites").update(patch).eq("id", input.mapsiteId)
      : supabase.from("mapsites").update(patch).ilike("fast_code", fastCode);
    const { error } = await write;
    if (error) {
      console.warn("[auto-draft-ebook] Could not save Mapsite™ branding:", error.message);
    } else if (input.mapsiteId && fastCode) {
      const { error: byCodeError } = await supabase
        .from("mapsites")
        .update(patch)
        .ilike("fast_code", fastCode);
      if (byCodeError) {
        console.warn(
          "[auto-draft-ebook] Could not save Mapsite™ branding by FAST Code:",
          byCodeError.message,
        );
      }
    }
  }

  if (shouldWriteAssets && requestId) {
    const { data: existing } = await supabase
      .from("mapsite_assets")
      .select("profile_image, logo_image, pin_image, monologue_pdf, ebook_pdf")
      .eq("request_id", requestId)
      .maybeSingle();

    const { error } = await supabase.from("mapsite_assets").upsert(
      {
        request_id: requestId,
        profile_image: photo || existing?.profile_image || null,
        logo_image: logo || existing?.logo_image || null,
        pin_image: existing?.pin_image || null,
        monologue_pdf: existing?.monologue_pdf || null,
        ebook_pdf: existing?.ebook_pdf || null,
      },
      { onConflict: "request_id" },
    );
    if (error) {
      console.warn("[auto-draft-ebook] Could not save Mapsite™ assets:", error.message);
    }
  }
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
  /** Pre-optimized agent photo URL (preferred over File). */
  agentPhotoUrl?: string | null;
  /** Pre-optimized brokerage logo URL (preferred over File). */
  brokerageLogoUrl?: string | null;
  /**
   * Raw image Files — only used when `optimizedImages` is empty (legacy / PDF fallback).
   * Prefer uploading via `/api/talispros/ebook-generate/upload-image` first.
   */
  images?: File[];
  /**
   * Already-optimized storage assets. When present, generation never re-encodes
   * or re-uploads property images.
   */
  optimizedImages?: OptimizedEbookImageAsset[];
  /** Provenance tag stored in metadata.source */
  source?: string;
  /**
   * `pdf` = exact page rasters in the viewer.
   * Page 1 is always treated as a cover spread (back left | front right);
   * remaining pages are interiors. No Glasshouse / layout engine.
   * `images` = Level 1/2/3 self-service page plan.
   */
  uploadMode?: AutoDraftUploadMode;
  bookOptions?: Partial<SelfServiceBookOptions>;
  captions?: SelfServicePageCaption[];
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
 * Automatically generate the first Talisbook™ as a Draft with a preview URL.
 * Self-service images: content-sized plan (≤20/22/24) with continuous landscape spreads.
 * PDF: exact page rasters (no Glasshouse / cover scaffolding).
 */
export async function autoGenerateDraftTalisBook(
  input: AutoDraftEbookInput
): Promise<AutoDraftEbookResult> {
  const pipelineStarted = onboardingNow();
  const fastCode = input.fastCode.trim().toLowerCase();
  const title = input.title.trim() || `${fastCode.toUpperCase()} Talisbook™`;
  const description =
    input.description?.trim() ||
    `Draft Talisbook™ for FAST Code ${fastCode.toUpperCase()}.`;
  const location = input.location?.trim() || "";

  if (!fastCode) return { success: false, error: "FAST Code is required." };
  const optimizedImages = (input.optimizedImages || []).filter(
    (item) => item.url && item.width > 0 && item.height > 0,
  );
  const rawImages = input.images || [];
  if (!optimizedImages.length && !rawImages.length) {
    return { success: false, error: "Upload at least one property image." };
  }
  if (!isSupabaseAdminConfigured()) {
    return { success: false, error: "Database is not configured." };
  }

  const entitlementsStarted = onboardingNow();
  const entitlementsPromise = getTalisBooksEntitlementSnapshot(fastCode);
  // Skip the heavy Mapsite™ context lookup when the form already supplied IDs.
  const contextPromise =
    input.mapsiteId?.trim() && input.accountType?.trim()
      ? Promise.resolve(null)
      : getMapSiteEbookContext(fastCode);

  const [entitlements, context] = await Promise.all([
    entitlementsPromise,
    contextPromise,
  ]);
  logOnboardingStep("Ebook entitlements", entitlementsStarted, {
    fastCode,
    bookCount: entitlements?.bookCount ?? null,
  });
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
    const brandingPromise = loadSelfServiceAgentDetails({
      fastCode,
      requestId: input.requestId?.trim() || null,
      mapsiteId,
      agentName: input.agentName,
      agentEmail: input.agentEmail,
      agentPhone: input.agentPhone,
      agentPhoto: input.agentPhoto,
      brokerageLogo: input.brokerageLogo,
      agentPhotoUrl: input.agentPhotoUrl,
      brokerageLogoUrl: input.brokerageLogoUrl,
    });
    const uploadStarted = onboardingNow();
    let coverImageUrl: string | null = null;
    let galleryUrls: string[] = [];
    let pageImageUrls: string[] = [];

    let pdfRefs: TalisBooksLayoutImageRef[] = [];

    if (optimizedImages.length > 0) {
      const processed = processOptimizedImageAssets(optimizedImages);
      coverImageUrl = processed.coverImageUrl;
      galleryUrls = processed.galleryUrls;
      pageImageUrls = processed.galleryUrls;
      logOnboardingStep("Storage upload", uploadStarted, {
        mode: "pdf",
        pages: pageImageUrls.length,
        preoptimized: true,
      });
    } else {
      const { refs, coverImageUrl: cover, galleryUrls: gallery } =
        await processUploadsAsExactPages({
          scope: fastCode,
          files: rawImages,
          altPrefix: title,
        });
      pdfRefs = refs;
      coverImageUrl = cover;
      galleryUrls = gallery;
      pageImageUrls = refs.map((ref) => ref.url);
      logOnboardingStep("Storage upload", uploadStarted, {
        mode: "pdf",
        pages: pageImageUrls.length,
      });
    }

    if (pageImageUrls.length === 0 || !coverImageUrl) {
      return {
        success: false,
        error: "Could not process PDF pages. Try exporting as images.",
      };
    }

    // Self-service rule: PDF page 1 = cover spread (back left | front right).
    const coverSpreadSourceUrl = pageImageUrls[0]!;
    const interiorUrls = pageImageUrls.slice(1);
    let frontCoverUrl = coverSpreadSourceUrl;
    let backCoverUrl = coverSpreadSourceUrl;
    let coverSpreadSplit = false;

    // Determine target single interior page dimensions (half-width if landscape spread).
    const firstInteriorMeta =
      optimizedImages.length > 1
        ? optimizedImages[1]
        : pdfRefs.length > 1
          ? { width: pdfRefs[1]!.width, height: pdfRefs[1]!.height }
          : null;
    const targetInteriorWidth = firstInteriorMeta
      ? firstInteriorMeta.width > firstInteriorMeta.height
        ? Math.round(firstInteriorMeta.width / 2)
        : firstInteriorMeta.width
      : undefined;
    const targetInteriorHeight = firstInteriorMeta
      ? firstInteriorMeta.height
      : undefined;

    try {
      const halves = await splitCoverSpreadFromUrl(coverSpreadSourceUrl, {
        targetWidth: targetInteriorWidth,
        targetHeight: targetInteriorHeight,
      });
      const coverId = crypto.randomUUID();
      const [frontUploaded, backUploaded] = await Promise.all([
        uploadBuffer({
          scope: fastCode,
          id: coverId,
          suffix: "cover-front",
          buffer: halves.front,
          mimeType: "image/jpeg",
        }),
        uploadBuffer({
          scope: fastCode,
          id: coverId,
          suffix: "cover-back",
          buffer: halves.back,
          mimeType: "image/jpeg",
        }),
      ]);
      if (frontUploaded) frontCoverUrl = frontUploaded;
      if (backUploaded) backCoverUrl = backUploaded;
      coverSpreadSplit = halves.splitApplied || Boolean(frontUploaded && backUploaded);
    } catch (error) {
      console.warn(
        "[auto-draft-ebook] Cover spread split failed; using page 1 as front cover.",
        error instanceof Error ? error.message : error,
      );
    }

    coverImageUrl = frontCoverUrl;

    const supabase = getSupabaseAdmin();
    const slug = uniqueSlug(fastCode, title);
    const now = new Date().toISOString();

    const pageRows: Array<{
      title: string;
      slug: string;
      page_number: number;
      sort_order: number;
      content: Record<string, unknown>;
      is_visible: boolean;
      created_at: string;
      updated_at: string;
    }> = [
      {
        title: "Front cover",
        slug: "pdf-front-cover",
        page_number: 1,
        sort_order: 1,
        content: {
          pageRole: "cover",
          layout: "cover",
          title: "",
          body: "",
          heroImageUrl: frontCoverUrl,
          exactPdfPage: true,
          coverSpreadHalf: "front",
          sourcePageIndex: 1,
        },
        is_visible: true,
        created_at: now,
        updated_at: now,
      },
    ];

    // Each remaining PDF page is a landscape slide → one continuous centerfold.
    interiorUrls.forEach((url, index) => {
      const leftPage = 2 + index * 2;
      const rightPage = leftPage + 1;
      const sourcePageIndex = index + 2;
      pageRows.push(
        {
          title: `Spread ${index + 1} · left`,
          slug: `pdf-spread-${String(index + 1).padStart(2, "0")}-left`,
          page_number: leftPage,
          sort_order: leftPage,
          content: {
            pageRole: "property_content",
            layout: "centerfold_left",
            layoutType: "spread",
            title: "",
            body: "",
            spreadImageUrl: url,
            spreadMat: true,
            brochureLeaf: "left",
            sourcePageIndex,
          },
          is_visible: true,
          created_at: now,
          updated_at: now,
        },
        {
          title: `Spread ${index + 1} · right`,
          slug: `pdf-spread-${String(index + 1).padStart(2, "0")}-right`,
          page_number: rightPage,
          sort_order: rightPage,
          content: {
            pageRole: "property_content",
            layout: "centerfold_right",
            layoutType: "spread",
            title: "",
            body: "",
            spreadImageUrl: url,
            spreadMat: true,
            brochureLeaf: "right",
            sourcePageIndex,
          },
          is_visible: true,
          created_at: now,
          updated_at: now,
        },
      );
    });

    const backPageNumber = pageRows.length + 1;
    pageRows.push({
      title: "Back cover",
      slug: "pdf-back-cover",
      page_number: backPageNumber,
      sort_order: backPageNumber,
      content: {
        pageRole: "cover",
        layout: "cover",
        title: "",
        body: "",
        heroImageUrl: backCoverUrl,
        exactPdfPage: true,
        coverSpreadHalf: "back",
        sourcePageIndex: 1,
      },
      is_visible: true,
      created_at: now,
      updated_at: now,
    });

    const pageCount = pageRows.length;
    const previewUrl = `${ROUTES.TALISBOOKS_VIEWER}/${slug}`;

    const dbStarted = onboardingNow();
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
          coverImageUrl: frontCoverUrl,
          backCoverImageUrl: backCoverUrl,
          coverSpreadImageUrl: coverSpreadSourceUrl,
          // Issuu opening: front cover alone on the right. Back cover is the last leaf.
          // Page 1 of the PDF is still interpreted as a cover spread (split into halves).
          coverSpreadOpening: false,
          coverSpreadSplit,
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
          landscapeAsSpreads: true,
          portraitPreserved: true,
        },
        created_at: now,
        updated_at: now,
      })
      .select("id, slug")
      .maybeSingle();

    if (bookError || !book) {
      logOnboardingStep("PDF generation", pipelineStarted, {
        failed: true,
        error: bookError?.message,
      });
      return {
        success: false,
        error: bookError?.message || "Failed to create PDF Talisbook™.",
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

    logOnboardingStep("PDF generation", dbStarted, {
      bookId: book.id,
      pageCount,
      coverSpreadSplit,
    });
    logOnboardingStep("Ebook pipeline", pipelineStarted, {
      mode: "pdf",
      fastCode,
      pageCount,
    });

    await brandingPromise.catch((error) => {
      console.warn(
        "[auto-draft-ebook] PDF branding persist failed:",
        error instanceof Error ? error.message : error,
      );
    });

    return {
      success: true,
      bookId: book.id,
      slug: book.slug,
      previewUrl,
      pageCount,
      mapsiteId,
    };
  }

  const imageStarted = onboardingNow();
  const imageAssetsPromise =
    optimizedImages.length > 0
      ? Promise.resolve(processOptimizedImageAssets(optimizedImages))
      : processUploadsForSelfServiceSpreads({
          scope: fastCode,
          files: rawImages,
          altPrefix: title,
        });

  const [
    {
      landscapes,
      coverSpreadImageUrl,
      coverImageUrl: initialCoverUrl,
      backCoverImageUrl: initialBackUrl,
      galleryUrls,
    },
    agent,
  ] =
    await Promise.all([
    imageAssetsPromise,
    loadSelfServiceAgentDetails({
      fastCode,
      requestId: input.requestId?.trim() || null,
      mapsiteId,
      agentName: input.agentName,
      agentEmail: input.agentEmail,
      agentPhone: input.agentPhone,
      agentPhoto: input.agentPhoto,
      brokerageLogo: input.brokerageLogo,
      agentPhotoUrl: input.agentPhotoUrl,
      brokerageLogoUrl: input.brokerageLogoUrl,
    }),
  ]);
  logOnboardingStep("Storage upload", imageStarted, {
    mode: "images",
    landscapes: landscapes.length,
    gallery: galleryUrls.length,
    preoptimized: optimizedImages.length > 0,
  });

  let coverImageUrl = initialCoverUrl;
  let backCoverImageUrl = initialBackUrl;
  let coverSpreadSplit = false;
  const coverSpreadSource = coverSpreadImageUrl || initialCoverUrl;

  if (coverSpreadImageUrl) {
    const firstInterior = landscapes[0];
    const targetInteriorWidth = firstInterior
      ? firstInterior.width > firstInterior.height
        ? Math.round(firstInterior.width / 2)
        : firstInterior.width
      : undefined;
    const targetInteriorHeight = firstInterior
      ? firstInterior.height
      : undefined;

    try {
      const halves = await splitCoverSpreadFromUrl(coverSpreadImageUrl, {
        targetWidth: targetInteriorWidth,
        targetHeight: targetInteriorHeight,
      });
      const coverId = crypto.randomUUID();
      const [frontUploaded, backUploaded] = await Promise.all([
        uploadBuffer({
          scope: fastCode,
          id: coverId,
          suffix: "cover-front",
          buffer: halves.front,
          mimeType: "image/jpeg",
        }),
        uploadBuffer({
          scope: fastCode,
          id: coverId,
          suffix: "cover-back",
          buffer: halves.back,
          mimeType: "image/jpeg",
        }),
      ]);
      if (frontUploaded) coverImageUrl = frontUploaded;
      if (backUploaded) backCoverImageUrl = backUploaded;
      coverSpreadSplit =
        halves.splitApplied || Boolean(frontUploaded && backUploaded);
    } catch (error) {
      console.warn(
        "[auto-draft-ebook] Image cover-spread split failed; using full landscape as cover.",
        error instanceof Error ? error.message : error,
      );
    }
  }

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
    backCoverImageUrl,
    agent,
    options: resolveSelfServiceBookOptions(input.bookOptions),
    captions: input.captions,
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

  const pageCount = planned.length;
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
        backCoverImageUrl,
        coverSpreadImageUrl: coverSpreadSource,
        coverSpreadOpening: false,
        coverSpreadSplit,
        galleryImageUrls: galleryUrls,
        location: location || null,
        source: input.source || "auto-draft-teb",
        requestId: input.requestId ?? null,
        globallyPublished: false,
        paymentRequired: false,
        previewUrl,
        autoGenerated: true,
        // Fixed page plan already embeds Glasshouse — do not re-inject.
        skipPermanentPages: true,
        selfServicePagePlan: true,
        facingPages: true,
        bookOptions: resolveSelfServiceBookOptions(input.bookOptions),
        landscapeAsSpreads: true,
        continuousCenterfolds: true,
        portraitPreserved: true,
        interiorImageCount: landscapes.length,
      },
      created_at: now,
      updated_at: now,
    })
    .select("id, slug")
    .maybeSingle();

  if (bookError || !book) {
    logOnboardingStep("Ebook pipeline", pipelineStarted, {
      failed: true,
      mode: "images",
      error: bookError?.message,
    });
    return {
      success: false,
      error: bookError?.message || "Failed to create draft Talisbook™.",
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

  logOnboardingStep("Ebook pipeline", pipelineStarted, {
    mode: "images",
    fastCode,
    pageCount,
    bookId: book.id,
  });

  return {
    success: true,
    bookId: book.id,
    slug: book.slug,
    previewUrl,
    pageCount,
    mapsiteId,
  };
}
