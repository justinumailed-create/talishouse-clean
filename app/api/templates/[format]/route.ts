import { NextResponse, type NextRequest } from "next/server";
import { isReplaceImageTemplateFormat, REPLACE_IMAGE_TEMPLATE_FILES } from "@/lib/talispros/replace-image-templates";
import {
  canDownloadReplaceImageTemplates,
  readReplaceImageTemplate,
} from "@/lib/talispros/replace-image-templates.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

/**
 * GET /api/templates/pptx|key?fastCode=… — "Replace Image" templates for
 * registered (paid, active) Mapsite owners and admins only.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ format: string }> },
) {
  const { format } = await context.params;
  if (!isReplaceImageTemplateFormat(format)) {
    return NextResponse.json({ error: "Unknown template format." }, { status: 404, headers: PRIVATE_HEADERS });
  }

  const fastCode = request.nextUrl.searchParams.get("fastCode");
  const allowed = await canDownloadReplaceImageTemplates(fastCode).catch(() => false);
  if (!allowed) {
    return NextResponse.json(
      { error: "Replace Image templates are available to registered Mapsite owners only." },
      { status: 403, headers: PRIVATE_HEADERS },
    );
  }

  let bytes: Buffer;
  try {
    bytes = await readReplaceImageTemplate(format);
  } catch (error) {
    console.error("[api/templates] template file missing:", error);
    return NextResponse.json({ error: "Template is unavailable." }, { status: 500, headers: PRIVATE_HEADERS });
  }

  const { fileName, contentType } = REPLACE_IMAGE_TEMPLATE_FILES[format];
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      ...PRIVATE_HEADERS,
      "Content-Type": contentType,
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
