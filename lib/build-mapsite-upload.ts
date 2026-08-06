import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  isLogoUploadField,
  stripLogoBackground,
} from "@/lib/media/strip-logo-background";

export async function uploadBuildMapsiteAsset(
  requestId: string,
  fieldName: string,
  file: File
): Promise<string | null> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const timestamp = Date.now();
    let uploadBody: Buffer | File = file;
    let contentType = file.type || "application/octet-stream";
    let ext = file.name.split(".").pop() || "bin";

    if (isLogoUploadField(fieldName)) {
      try {
        const source = Buffer.from(await file.arrayBuffer());
        const stripped = await stripLogoBackground(source);
        uploadBody = stripped.buffer;
        contentType = stripped.mimeType;
        ext = "png";
      } catch (err) {
        console.error(`[build-mapsite] Logo background strip failed:`, err);
      }
    }

    const path = `${requestId}/${fieldName}-${timestamp}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from("mapsite-assets")
      .upload(path, uploadBody, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error(`[build-mapsite] Upload failed for ${fieldName}:`, error);
      return null;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("mapsite-assets")
      .getPublicUrl(path);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error(`[build-mapsite] Upload error for ${fieldName}:`, err);
    return null;
  }
}
