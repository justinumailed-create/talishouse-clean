import {
  isolatedBookshelfSeoMetadata,
  resolveIsolatedBookshelfBookDescription,
  withIsolatedBookshelfMetadata,
} from "@/lib/talisbooks/isolated-bookshelf";
import { resolvePersistedBookTitle } from "@/lib/talisbooks/book-title";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { ROUTES } from "@/lib/routes";
import type { TalisBooksLayoutImageRef } from "@/lib/talisbooks/layout-engine/types";
import {
  TALISBOOKS_ASSET_CACHE_CONTROL,
  TALISBOOKS_IMAGE_STORAGE_BUCKET,
} from "@/lib/talisbooks/image-engine";
import { getMapSiteEbookContext } from "@/lib/talisbooks/mapsite-ebook-service";
import { isDemoMapSiteCode } from "@/lib/talispros/demo-mapsite";
import {
  assertTalisBooksFeature,
  getTalisBooksEntitlementSnapshot,
} from "@/lib/talisbooks/entitlements";
import {
  assignFacingUploadRoles,
  buildSelfServiceEbookPageRows,
  resolveSelfServiceBookOptions,
  isPortraitCoverImage,
  FRONT_COVER_PORTRAIT_MESSAGE,
  BACK_COVER_PORTRAIT_MESSAGE,
  FRONT_COVER_REQUIRED_MESSAGE,
  BACK_COVER_REQUIRED_MESSAGE,
  type ExplicitCoverAsset,
  type SelfServiceAgentDetails,
  type SelfServiceBookOptions,
  type SelfServiceLandscapeAsset,
  type SelfServicePageCaption,
} from "@/lib/talisbooks/self-service-page-plan";
import {
  buildRm22TemplatePageRows,
  type Rm22SlotHydration,
  type Rm22TemplatePayload,
} from "@/lib/talisbooks/rm22-template";
import {
  logOnboardingStep,
  onboardingNow,
} from "@/lib/onboarding-timing";
import { optimizeUploadImage } from "@/lib/media/optimize-upload-image";
import { rejectDisallowedEbookFiles } from "@/lib/talisbooks/ebook-upload-formats-server";
import {
  MAPSITE_FLAG_IDENTITY_DEFAULT,
  resolveMapsiteFlagIdentity,
  type MapsiteFlagIdentity,
} from "@/lib/talispros/flag-identity";

function demoEbookPublishFields(fastCode: string, now: string): {
  publish_status: "published" | "draft";
  published_at: string | null;
} {
  if (isDemoMapSiteCode(fastCode)) {
    return { publish_status: "published", published_at: now };
  }
  return { publish_status: "draft", published_at: null };
}

function ebookInsertPublishFields(input: {
  fastCode: string;
  now: string;
  asAdmin?: boolean;
  replacing?: boolean;
}): {
  publish_status: "published" | "draft";
  published_at: string | null;
} {
  if (input.asAdmin && !input.replacing) {
    return { publish_status: "published", published_at: input.now };
  }
  return demoEbookPublishFields(input.fastCode, input.now);
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/** First book binds Mapsite™ TEB. Additional books stay on the shelf without replacing it. */
export function shouldBindMapsiteTebListing(input: {
  replacing: boolean;
  existingTebUrl?: string | null;
}): boolean {
  if (input.replacing) return true;
  return !(input.existingTebUrl || "").trim();
}

async function persistMapsiteEbookListing(input: {
  mapsiteId: string | null;
  previewUrl: string;
  listingImageUrls: string[];
  now: string;
  replacing?: boolean;
}): Promise<void> {
  if (!input.mapsiteId || !isSupabaseAdminConfigured()) return;
  const supabase = getSupabaseAdmin();
  const { data: mapsite } = await supabase
    .from("mapsites")
    .select("teb_url")
    .eq("id", input.mapsiteId)
    .maybeSingle();
  if (
    !shouldBindMapsiteTebListing({
      replacing: Boolean(input.replacing),
      existingTebUrl: mapsite?.teb_url,
    })
  ) {
    return;
  }
  const urls = input.listingImageUrls.map((url) => url.trim()).filter(Boolean);
  await supabase
    .from("mapsites")
    .update({
      teb_url: input.previewUrl,
      ...(urls[0]
        ? {
            cover_image: urls[0],
            header_image_url: urls[0],
            gallery_images: urls,
          }
        : {}),
      updated_at: input.now,
    })
    .eq("id", input.mapsiteId);
}

function uniqueSlug(scope: string, title: string): string {
  const base = slugify(`${scope}-${title}`) || `${scope}-teb`;
  const suffix = Date.now().toString(36).slice(-4);
  return `${base}-${suffix}`;
}

type GeneratedBookPageRow = {
  title: string;
  slug: string;
  page_number: number;
  sort_order: number;
  content: Record<string, unknown>;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

async function persistGeneratedEbook(input: {
  replaceBookId?: string | null;
  fastCode: string;
  mapsiteId: string | null;
  accountType: string;
  title: string;
  subtitle: string;
  description: string;
  pageRows: GeneratedBookPageRow[];
  metadata: Record<string, unknown>;
  publishFields: { publish_status: "published" | "draft"; published_at: string | null };
  now: string;
}): Promise<{ id: string; slug: string } | { error: string }> {
  const supabase = getSupabaseAdmin();
  const replaceId = input.replaceBookId?.trim() || "";
  const pageCount = input.pageRows.length;

  if (replaceId) {
    const { data: existing, error } = await supabase
      .from("talisbooks_books")
      .select("id, slug, fast_code, mapsite_id")
      .eq("id", replaceId)
      .maybeSingle();
    if (error || !existing) {
      return { error: "That Talisbook™ could not be found." };
    }
    if (String(existing.fast_code || "").toLowerCase() !== input.fastCode.toLowerCase()) {
      return { error: "That Talisbook™ does not belong to this FAST Code." };
    }
    if (
      input.mapsiteId &&
      existing.mapsite_id &&
      existing.mapsite_id !== input.mapsiteId
    ) {
      return { error: "That Talisbook™ does not belong to this Mapsite™." };
    }
    const previewUrl = `${ROUTES.TALISBOOKS_VIEWER}/${existing.slug}`;
    const { error: updateError } = await supabase
      .from("talisbooks_books")
      .update({
        title: input.title,
        subtitle: input.subtitle,
        description: input.description,
        page_count: pageCount,
        mapsite_id: input.mapsiteId,
        metadata: { ...input.metadata, previewUrl },
        updated_at: input.now,
      })
      .eq("id", existing.id);
    if (updateError) {
      return { error: updateError.message || "Failed to update Talisbook™." };
    }
    const { error: deleteError } = await supabase
      .from("talisbooks_book_pages")
      .delete()
      .eq("book_id", existing.id);
    if (deleteError) {
      return { error: deleteError.message || "Failed to replace Talisbook™ pages." };
    }
    const { error: pagesError } = await supabase
      .from("talisbooks_book_pages")
      .insert(input.pageRows.map((row) => ({ ...row, book_id: existing.id })));
    if (pagesError) {
      console.error("[auto-draft-ebook] Pages replace failed:", pagesError.message);
    }
    return { id: existing.id, slug: existing.slug };
  }

  const slug = uniqueSlug(input.fastCode, input.title);
  const previewUrl = `${ROUTES.TALISBOOKS_VIEWER}/${slug}`;
  const { data: book, error: bookError } = await supabase
    .from("talisbooks_books")
    .insert({
      slug,
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      ...input.publishFields,
      page_count: pageCount,
      is_public:
        input.metadata?.isolatedBookshelf === true
          ? false
          : input.publishFields.publish_status === "published",
      mapsite_id: input.mapsiteId,
      fast_code: input.fastCode,
      account_type: input.accountType,
      metadata: { ...input.metadata, previewUrl },
      created_at: input.now,
      updated_at: input.now,
    })
    .select("id, slug")
    .maybeSingle();

  if (bookError || !book) {
    return { error: bookError?.message || "Failed to create draft Talisbook™." };
  }

  const { error: pagesError } = await supabase
    .from("talisbooks_book_pages")
    .insert(input.pageRows.map((row) => ({ ...row, book_id: book.id })));
  if (pagesError) {
    console.error("[auto-draft-ebook] Pages insert failed:", pagesError.message);
  }
  return { id: book.id, slug: book.slug };
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
 * Every image is interior content; covers are explicit portrait assets.
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

  for (const ref of processed) {
    if (!ref) continue;
    refs.push(ref);
    galleryUrls.push(ref.url);
  }

  return { refs, coverImageUrl: null, galleryUrls };
}

export type OptimizedEbookImageAsset = {
  url: string;
  width: number;
  height: number;
};

/**
 * Use already-optimized storage URLs (no second encode pass).
 * Every image is interior content.
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

function pdfInteriorSpreadRows(options: {
  urls: string[];
  startPage: number;
  now: string;
}): Array<{
  title: string;
  slug: string;
  page_number: number;
  sort_order: number;
  content: Record<string, unknown>;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}> {
  const rows: Array<{
    title: string;
    slug: string;
    page_number: number;
    sort_order: number;
    content: Record<string, unknown>;
    is_visible: boolean;
    created_at: string;
    updated_at: string;
  }> = [];
  options.urls.forEach((url, index) => {
    const leftPage = options.startPage + index * 2;
    const rightPage = leftPage + 1;
    const sourcePageIndex = index + 1;
    rows.push(
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
        created_at: options.now,
        updated_at: options.now,
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
        created_at: options.now,
        updated_at: options.now,
      },
    );
  });
  return rows;
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
  /** Replace this book's pages in place instead of inserting a new Talisbook™. */
  replaceBookId?: string | null;
  /** Mapsite™ / platform editor: additional books are allowed even if client quota is locked. */
  asAdmin?: boolean;
  /** Catalogue isolated bookshelf — not listed on public /talisbooks. */
  isolatedBookshelf?: boolean;
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
   * `pdf` = exact page rasters in the viewer as interior content.
   * Page 1 is not a cover. Front/back covers are explicit portrait assets.
   * `images` = Level 1/2/3 self-service page plan.
   */
  uploadMode?: AutoDraftUploadMode;
  bookOptions?: Partial<SelfServiceBookOptions>;
  captions?: SelfServicePageCaption[];
  /** Explicit portrait front cover (not inferred from page 1). */
  frontCover?: ExplicitCoverAsset | null;
  /** Explicit portrait back cover (not inferred from page 1). */
  backCover?: ExplicitCoverAsset | null;
  /** RM22 magazine template — interiors keep image/text slots unflattened. */
  rm22Template?: Rm22TemplatePayload | null;
  /** Template slot copy/urls persisted so admin can edit the same book later. */
  rm22SlotHydration?: Rm22SlotHydration | null;
  /** Choose for Flag: Name or Address. FSBO is forced to Address. */
  flagIdentity?: MapsiteFlagIdentity;
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
  const title = resolvePersistedBookTitle(input.title);
  const description = input.isolatedBookshelf
    ? resolveIsolatedBookshelfBookDescription(input.description)
    : input.description?.trim() ||
      `Draft Talisbook™ for FAST Code ${fastCode.toUpperCase()}.`;
  const location = input.location?.trim() || "";

  if (!fastCode) return { success: false, error: "FAST Code is required." };
  const optimizedImages = (input.optimizedImages || []).filter(
    (item) => item.url && item.width > 0 && item.height > 0,
  );
  const rawImages = input.images || [];
  const disallowed = rejectDisallowedEbookFiles([
    ...rawImages,
    ...(input.agentPhoto ? [input.agentPhoto] : []),
    ...(input.brokerageLogo ? [input.brokerageLogo] : []),
  ]);
  if (disallowed) {
    return { success: false, error: disallowed };
  }
  if (!optimizedImages.length && !rawImages.length && !input.rm22Template) {
    return { success: false, error: "Upload at least one property image." };
  }
  const frontProvided = Boolean(input.frontCover?.url.trim());
  const backProvided = Boolean(input.backCover?.url.trim());
  if (frontProvided && input.frontCover && !isPortraitCoverImage(input.frontCover.width, input.frontCover.height)) {
    return { success: false, error: FRONT_COVER_PORTRAIT_MESSAGE };
  }
  if (backProvided && input.backCover && !isPortraitCoverImage(input.backCover.width, input.backCover.height)) {
    return { success: false, error: BACK_COVER_PORTRAIT_MESSAGE };
  }
  if (frontProvided !== backProvided) {
    return {
      success: false,
      error: frontProvided
        ? BACK_COVER_REQUIRED_MESSAGE
        : FRONT_COVER_REQUIRED_MESSAGE,
    };
  }
  const frontCoverUrl = frontProvided ? input.frontCover!.url.trim() : null;
  const backCoverUrl = backProvided ? input.backCover!.url.trim() : null;
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
  if (entitlements && !input.replaceBookId?.trim() && !input.asAdmin) {
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
  const flagIdentity = resolveMapsiteFlagIdentity({
    preference: input.flagIdentity || MAPSITE_FLAG_IDENTITY_DEFAULT,
    accountType: input.accountType,
  });

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
    let galleryUrls: string[] = [];
    let pageImageUrls: string[] = [];

    if (optimizedImages.length > 0) {
      const processed = processOptimizedImageAssets(optimizedImages);
      galleryUrls = processed.galleryUrls;
      pageImageUrls = processed.galleryUrls;
      logOnboardingStep("Storage upload", uploadStarted, {
        mode: "pdf",
        pages: pageImageUrls.length,
        preoptimized: true,
      });
    } else {
      const { refs, galleryUrls: gallery } = await processUploadsAsExactPages({
        scope: fastCode,
        files: rawImages,
        altPrefix: title,
      });
      galleryUrls = gallery;
      pageImageUrls = refs.map((ref) => ref.url);
      logOnboardingStep("Storage upload", uploadStarted, {
        mode: "pdf",
        pages: pageImageUrls.length,
      });
    }

    if (pageImageUrls.length === 0) {
      return {
        success: false,
        error: "Could not process PDF pages. Try exporting as images.",
      };
    }

    const now = new Date().toISOString();

    const pageRows: GeneratedBookPageRow[] = [];

    if (frontCoverUrl) {
      pageRows.push({
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
        },
        is_visible: true,
        created_at: now,
        updated_at: now,
      });
    }

    pageRows.push(
      ...pdfInteriorSpreadRows({
        urls: pageImageUrls,
        startPage: frontCoverUrl ? 2 : 1,
        now,
      }),
    );

    if (backCoverUrl) {
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
        },
        is_visible: true,
        created_at: now,
        updated_at: now,
      });
    }

    const pageCount = pageRows.length;
    const dbStarted = onboardingNow();
    const persisted = await persistGeneratedEbook({
      replaceBookId: input.replaceBookId,
      fastCode,
      mapsiteId,
      accountType,
      title,
      subtitle: location || "PDF",
      description,
      pageRows,
      publishFields: ebookInsertPublishFields({
        fastCode,
        now,
        asAdmin: input.asAdmin,
        replacing: Boolean(input.replaceBookId?.trim()),
      }),
      now,
      metadata: {
        coverImageUrl: frontCoverUrl,
        backCoverImageUrl: backCoverUrl,
        coverSpreadImageUrl: null,
        coverSpreadOpening: false,
        coverSpreadSplit: false,
        explicitCovers: true,
        galleryImageUrls: galleryUrls,
        location: location || null,
        source: input.source || "self-service-pdf",
        ...(input.isolatedBookshelf
          ? {
              ...withIsolatedBookshelfMetadata(),
              ...isolatedBookshelfSeoMetadata(description),
            }
          : {}),
        requestId: input.requestId ?? null,
        globallyPublished: false,
        paymentRequired: false,
        autoGenerated: true,
        exactPdfPages: true,
        skipPermanentPages: true,
        landscapeAsSpreads: true,
        portraitPreserved: true,
        rm22Template: false,
        rm22SlotHydration: null,
        flagIdentity,
        flagName: input.agentName?.trim() || null,
      },
    });

    if ("error" in persisted) {
      logOnboardingStep("PDF generation", pipelineStarted, {
        failed: true,
        error: persisted.error,
      });
      return {
        success: false,
        error: persisted.error,
      };
    }

    const previewUrl = `${ROUTES.TALISBOOKS_VIEWER}/${persisted.slug}`;

    await persistMapsiteEbookListing({
      mapsiteId,
      previewUrl,
      listingImageUrls: galleryUrls,
      now,
      replacing: Boolean(input.replaceBookId?.trim()),
    });

    logOnboardingStep("PDF generation", dbStarted, {
      bookId: persisted.id,
      pageCount,
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
      bookId: persisted.id,
      slug: persisted.slug,
      previewUrl,
      pageCount,
      mapsiteId,
    };
  }

  const imageStarted = onboardingNow();
  const imageAssetsPromise =
    optimizedImages.length > 0
      ? Promise.resolve(processOptimizedImageAssets(optimizedImages))
      : rawImages.length > 0
        ? processUploadsForSelfServiceSpreads({
            scope: fastCode,
            files: rawImages,
            altPrefix: title,
          })
        : Promise.resolve({
            landscapes: [] as SelfServiceLandscapeAsset[],
            coverSpreadImageUrl: null,
            coverImageUrl: null,
            backCoverImageUrl: null,
            galleryUrls: [] as string[],
          });

  const [
    { landscapes, galleryUrls },
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

  const coverImageUrl = frontCoverUrl;
  const backCoverImageUrl = backCoverUrl;
  const rm22Template = input.rm22Template ?? null;
  const listingUrls =
    rm22Template && rm22Template.interiors.length > 0
      ? rm22Template.interiors.map((item) => item.imageUrl).filter(Boolean)
      : galleryUrls;

  if (!rm22Template && landscapes.length === 0) {
    return {
      success: false,
      error: "Could not process property images. Try JPG or PNG files.",
    };
  }

  const planned = rm22Template
    ? buildRm22TemplatePageRows({
        coverImageUrl,
        backCoverImageUrl,
        interiors: rm22Template.interiors,
      })
    : buildSelfServiceEbookPageRows({
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

  const now = new Date().toISOString();
  const pageRows = planned.map((row) => ({
    ...row,
    is_visible: true,
    created_at: now,
    updated_at: now,
  }));

  const pageCount = planned.length;
  const persisted = await persistGeneratedEbook({
    replaceBookId: input.replaceBookId,
    fastCode,
    mapsiteId,
    accountType,
    title,
    subtitle: location || "Draft",
    description,
    pageRows,
    publishFields: ebookInsertPublishFields({
      fastCode,
      now,
      asAdmin: input.asAdmin,
      replacing: Boolean(input.replaceBookId?.trim()),
    }),
    now,
    metadata: {
      coverImageUrl,
      backCoverImageUrl,
      coverSpreadImageUrl: null,
      coverSpreadOpening: false,
      coverSpreadSplit: false,
      explicitCovers: true,
      galleryImageUrls: listingUrls,
      location: location || null,
      source: input.source || "auto-draft-teb",
        ...(input.isolatedBookshelf
          ? {
              ...withIsolatedBookshelfMetadata(),
              ...isolatedBookshelfSeoMetadata(description),
            }
          : {}),
      requestId: input.requestId ?? null,
      globallyPublished: false,
      paymentRequired: false,
      autoGenerated: true,
      skipPermanentPages: true,
      selfServicePagePlan: true,
      facingPages: true,
      bookOptions: resolveSelfServiceBookOptions(input.bookOptions),
      landscapeAsSpreads: true,
      continuousCenterfolds: true,
      portraitPreserved: true,
      interiorImageCount: rm22Template
        ? rm22Template.interiors.length
        : landscapes.length,
      rm22Template: Boolean(rm22Template),
      templateId: rm22Template ? "rm22" : undefined,
      rm22SlotHydration: rm22Template ? input.rm22SlotHydration ?? null : null,
      flagIdentity,
      flagName: input.agentName?.trim() || null,
    },
  });

  if ("error" in persisted) {
    logOnboardingStep("Ebook pipeline", pipelineStarted, {
      failed: true,
      mode: "images",
      error: persisted.error,
    });
    return {
      success: false,
      error: persisted.error,
    };
  }

  const previewUrl = `${ROUTES.TALISBOOKS_VIEWER}/${persisted.slug}`;

  await persistMapsiteEbookListing({
    mapsiteId,
    previewUrl,
    listingImageUrls: listingUrls,
    now,
    replacing: Boolean(input.replaceBookId?.trim()),
  });

  logOnboardingStep("Ebook pipeline", pipelineStarted, {
    mode: "images",
    fastCode,
    pageCount,
    bookId: persisted.id,
  });

  return {
    success: true,
    bookId: persisted.id,
    slug: persisted.slug,
    previewUrl,
    pageCount,
    mapsiteId,
  };
}
