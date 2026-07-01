import { uploadBuildMapsiteAsset } from "@/lib/build-mapsite-upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const requestId = formData.get("requestId");
    const fieldName = formData.get("fieldName");
    const file = formData.get("file");

    if (
      typeof requestId !== "string" ||
      !requestId.trim() ||
      typeof fieldName !== "string" ||
      !fieldName.trim() ||
      !(file instanceof File) ||
      file.size === 0
    ) {
      return Response.json({ error: "Invalid upload request" }, { status: 400 });
    }

    const url = await uploadBuildMapsiteAsset(
      requestId.trim(),
      fieldName.trim(),
      file
    );

    if (!url) {
      return Response.json({ error: "Upload failed" }, { status: 500 });
    }

    return Response.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[build-mapsite/upload] Error:", err);
    return Response.json({ error: message }, { status: 500 });
  }
}
