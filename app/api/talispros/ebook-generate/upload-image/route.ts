import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  extensionForOptimizedMime,
  optimizeUploadImage,
  parseOptimizeImageKind,
  type OptimizeImageKind,
} from "@/lib/media/optimize-upload-image";
import {
  TALISBOOKS_ASSET_CACHE_CONTROL,
  TALISBOOKS_IMAGE_STORAGE_BUCKET,
} from "@/lib/talisbooks/image-engine";
import { resolveOnboardingUploadScope } from "@/lib/talispros/resolve-onboarding-from-request";
import {
  logOnboardingStep,
  onboardingNow,
} from "@/lib/onboarding-timing";

export const dynamic = "force-dynamic";
/** Sharp + storage for a large phone photo routinely exceeds 30s. */
export const maxDuration = 120;

export type EbookOptimizedUploadResponse = {
  ok: true;
  url: string;
  width: number;
  height: number;
  bytes: number;
  originalBytes: number;
  mimeType: string;
  kind: OptimizeImageKind;
  compressionRatio: number;
};

function isUploadBlob(value: FormDataEntryValue | null): value is Blob {
  return typeof Blob !== "undefined" && value instanceof Blob && value.size > 0;
}

/**
 * Optimize one image and store it. Client uploads files individually to avoid 413.
 *
 * FormData: requestId, kind (property|agent|logo), file, optional index/label
 */
export async function POST(request: Request) {
  const started = onboardingNow();

  try {
    if (!isSupabaseAdminConfigured()) {
      return Response.json(
        { ok: false, error: "Storage is not configured." },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const requestId = String(formData.get("requestId") || "").trim();
    const kind = parseOptimizeImageKind(String(formData.get("kind") || "property"));
    const label = String(formData.get("label") || "").trim();
    const fileEntry = formData.get("file");

    if (!requestId) {
      return Response.json(
        { ok: false, error: "Build Request ID is required." },
        { status: 400 },
      );
    }
    if (!isUploadBlob(fileEntry)) {
      return Response.json(
        { ok: false, error: label ? `Missing file: ${label}` : "Missing image file." },
        { status: 400 },
      );
    }

    const scoped = await resolveOnboardingUploadScope(requestId);
    if (!scoped.ok) {
      return Response.json({ ok: false, error: scoped.error }, { status: 400 });
    }

    const scope = scoped.fastCode || requestId;
    const source = Buffer.from(await fileEntry.arrayBuffer());
    const optimized = await optimizeUploadImage(source, kind);
    const ext = extensionForOptimizedMime(optimized.mimeType);
    const id = crypto.randomUUID();
    const path = `auto-draft/${scope}/${id}-${kind}.${ext}`;

    const supabase = getSupabaseAdmin();
    let uploadedPath = path;
    let bucket = TALISBOOKS_IMAGE_STORAGE_BUCKET;

    const primary = await supabase.storage.from(bucket).upload(path, optimized.buffer, {
      contentType: optimized.mimeType,
      cacheControl: TALISBOOKS_ASSET_CACHE_CONTROL,
      upsert: false,
    });

    if (primary.error) {
      const missingBucket = /bucket|not found|does not exist/i.test(
        primary.error.message || "",
      );
      if (!missingBucket) {
        console.error("[ebook-upload-image] Upload failed:", primary.error.message);
        return Response.json(
          {
            ok: false,
            error: label
              ? `Failed to store optimized image “${label}”.`
              : "Failed to store optimized image.",
          },
          { status: 500 },
        );
      }
      bucket = "mapsite-assets";
      uploadedPath = path;
      const fallback = await supabase.storage
        .from(bucket)
        .upload(uploadedPath, optimized.buffer, {
          contentType: optimized.mimeType,
          cacheControl: TALISBOOKS_ASSET_CACHE_CONTROL,
          upsert: false,
        });
      if (fallback.error) {
        return Response.json(
          { ok: false, error: "Failed to store optimized image." },
          { status: 500 },
        );
      }
    }

    const url =
      supabase.storage.from(bucket).getPublicUrl(uploadedPath).data.publicUrl || "";
    if (!url) {
      return Response.json(
        { ok: false, error: "Optimized image URL missing." },
        { status: 500 },
      );
    }

    const compressionRatio =
      optimized.originalBytes > 0
        ? Number((optimized.bytes / optimized.originalBytes).toFixed(4))
        : 1;

    logOnboardingStep("Ebook image optimize+upload", started, {
      requestId,
      kind,
      label: label || null,
      originalBytes: optimized.originalBytes,
      bytes: optimized.bytes,
      width: optimized.width,
      height: optimized.height,
      compressionRatio,
      mimeType: optimized.mimeType,
    });

    const body: EbookOptimizedUploadResponse = {
      ok: true,
      url,
      width: optimized.width,
      height: optimized.height,
      bytes: optimized.bytes,
      originalBytes: optimized.originalBytes,
      mimeType: optimized.mimeType,
      kind,
      compressionRatio,
    };
    return Response.json(body);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image optimization failed.";
    console.error("[ebook-upload-image]", error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
