import { renderTalisprosOgCard } from "@/lib/share/render-talispros-og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Content-Type": "image/jpeg",
  "Cache-Control":
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

/**
 * Landscape brand Open Graph card shared by homepage + T-All Product catalogue.
 * Logo + Aisha on the left, ALLPINS multi-pin Mapsite map on the right.
 */
export async function GET() {
  try {
    const jpeg = await renderTalisprosOgCard();
    return new Response(new Uint8Array(jpeg), { headers: HEADERS });
  } catch (error) {
    console.error(
      "[og] Talispros brand card failed:",
      error instanceof Error ? error.message : error,
    );
    return new Response("Open Graph image is unavailable.", { status: 500 });
  }
}
