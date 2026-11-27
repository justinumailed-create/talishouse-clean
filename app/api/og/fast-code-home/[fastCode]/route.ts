import { isBrandedFastCodeHomeMedia } from "@/lib/talispros/branded-fast-code-media";
import { renderBrandedFastCodeOgJpeg } from "@/lib/talispros/branded-fast-code-media-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Content-Type": "image/jpeg",
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ fastCode: string }> },
) {
  const { fastCode } = await context.params;
  if (!isBrandedFastCodeHomeMedia(fastCode)) {
    return new Response("Not found", { status: 404 });
  }
  const jpeg = await renderBrandedFastCodeOgJpeg(fastCode);
  if (!jpeg) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(new Uint8Array(jpeg), { headers: HEADERS });
}
