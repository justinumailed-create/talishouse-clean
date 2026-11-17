import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import {
  extensionForOptimizedMime,
  optimizeUploadImage,
} from "@/lib/media/optimize-upload-image";
import { VERCEL_FUNCTION_BODY_LIMIT_BYTES } from "@/lib/media/upload-size-limits";
import {
  TALISBOOKS_ASSET_CACHE_CONTROL,
  TALISBOOKS_IMAGE_STORAGE_BUCKET,
} from "@/lib/talisbooks/image-engine";
import { assertAllowedEbookImageBuffer } from "@/lib/talisbooks/ebook-upload-formats-server";
import { PERSONAL_HOME_VIDEO_MAX_BYTES } from "@/lib/talispros/personal-home";
import { canEditPersonalHome } from "@/lib/talispros/personal-home-page";
import { findMapSiteIdentityByFastCode } from "@/lib/talispros/personal-home-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function isUploadBlob(value: FormDataEntryValue | null): value is File {
  return (
    value != null &&
    typeof value !== "string" &&
    typeof Blob !== "undefined" &&
    value instanceof Blob &&
    value.size > 0
  );
}

/**
 * Owner photo for the personal home page. FormData: fastCode, file.
 * Same gate as the page's edit controls (owner session, root account, admin);
 * no Mapsite payment is required.
 */
export async function POST(request: Request) {
  try {
    if (!isSupabaseAdminConfigured()) {
      return Response.json({ ok: false, error: "storage" }, { status: 503 });
    }
    const formData = await request.formData();
    const fastCode = String(formData.get("fastCode") || "").trim().toLowerCase();
    const fileEntry = formData.get("file");

    if (!fastCode || !(await canEditPersonalHome(fastCode))) {
      return Response.json({ ok: false, error: "auth" }, { status: 401 });
    }
    const identity = await findMapSiteIdentityByFastCode(fastCode);
    if (!identity || identity.isDemonstration) {
      return Response.json({ ok: false, error: "auth" }, { status: 401 });
    }
    if (!isUploadBlob(fileEntry)) {
      return Response.json({ ok: false, error: "photo" }, { status: 400 });
    }
    const fileName = typeof fileEntry.name === "string" ? fileEntry.name : "";
    const fileType = typeof fileEntry.type === "string" ? fileEntry.type : "";
    const video = fileType === "video/mp4" || fileName.toLowerCase().endsWith(".mp4");
    if (video) {
      if (fileEntry.size > PERSONAL_HOME_VIDEO_MAX_BYTES) {
        return Response.json({ ok: false, error: "video" }, { status: 413 });
      }
      const buffer = Buffer.from(await fileEntry.arrayBuffer());
      if (buffer.length < 12 || buffer.subarray(4, 8).toString("ascii") !== "ftyp") {
        return Response.json({ ok: false, error: "video" }, { status: 415 });
      }
      const videoPath = `personal-home/${identity.id}/video-${crypto.randomUUID()}.mp4`;
      const uploaded = await uploadBuffer(videoPath, buffer, "video/mp4");
      if (!uploaded) return Response.json({ ok: false, error: "video" }, { status: 500 });
      return Response.json({ ok: true, url: uploaded, kind: "video" });
    }
    if (fileEntry.size > VERCEL_FUNCTION_BODY_LIMIT_BYTES) {
      return Response.json({ ok: false, error: "photo" }, { status: 413 });
    }

    const source = Buffer.from(await fileEntry.arrayBuffer());
    try {
      await assertAllowedEbookImageBuffer(source, {
        name: typeof fileEntry.name === "string" ? fileEntry.name : "",
        type: typeof fileEntry.type === "string" ? fileEntry.type : "",
      });
    } catch {
      return Response.json({ ok: false, error: "photo" }, { status: 400 });
    }

    const optimized = await optimizeUploadImage(source, "agent");
    const ext = extensionForOptimizedMime(optimized.mimeType);
    const path = `personal-home/${identity.id}/${crypto.randomUUID()}.${ext}`;
    const url = await uploadBuffer(path, optimized.buffer, optimized.mimeType);
    if (!url) return Response.json({ ok: false, error: "photo" }, { status: 500 });
    return Response.json({ ok: true, url });
  } catch (error) {
    console.error(
      "[personal-home-upload] Failed:",
      error instanceof Error ? error.message : error,
    );
    return Response.json({ ok: false, error: "photo" }, { status: 500 });
  }
}

async function uploadBuffer(path: string, buffer: Buffer, contentType: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const options = {
    contentType,
    cacheControl: TALISBOOKS_ASSET_CACHE_CONTROL,
    upsert: false,
  };
  let bucket = TALISBOOKS_IMAGE_STORAGE_BUCKET;
  const primary = await supabase.storage.from(bucket).upload(path, buffer, options);
  if (primary.error) {
    if (!/bucket|not found|does not exist/i.test(primary.error.message || "")) {
      console.error("[personal-home-upload] Upload failed:", primary.error.message);
      return null;
    }
    bucket = "mapsite-assets";
    const fallback = await supabase.storage.from(bucket).upload(path, buffer, options);
    if (fallback.error) return null;
  }
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl || null;
}
