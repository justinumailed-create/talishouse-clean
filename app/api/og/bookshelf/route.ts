import { renderBookshelfOgCard } from "@/lib/share/render-bookshelf-og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Content-Type": "image/jpeg",
  "Cache-Control":
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

/**
 * Portrait bookshelf Open Graph card shared by catalogue + FAST TEB™ shelves.
 * Distinct from landscape Mapsite™ ALLPINS / viewer parting-shot cards.
 */
export async function GET() {
  try {
    const jpeg = await renderBookshelfOgCard();
    return new Response(new Uint8Array(jpeg), { headers: HEADERS });
  } catch (error) {
    console.error(
      "[og] Bookshelf card failed:",
      error instanceof Error ? error.message : error,
    );
    return new Response("Open Graph image is unavailable.", { status: 500 });
  }
}
