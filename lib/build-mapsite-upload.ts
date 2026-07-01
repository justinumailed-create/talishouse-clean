import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function uploadBuildMapsiteAsset(
  requestId: string,
  fieldName: string,
  file: File
): Promise<string | null> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const ext = file.name.split(".").pop() || "bin";
    const timestamp = Date.now();
    const path = `${requestId}/${fieldName}-${timestamp}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from("mapsite-assets")
      .upload(path, file, {
        contentType: file.type,
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
