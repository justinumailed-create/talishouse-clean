import { fetchOgImageBuffer } from "@/lib/share/fetch-og-image";
import { loadViewerPartingShotUrl } from "@/lib/share/load-share-og-scene";
import { planViewerShareOg } from "@/lib/share/og-card";
import { renderShareOgCard } from "@/lib/share/render-share-og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Content-Type": "image/jpeg",
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const normalized = slug?.trim() || "";

  try {
    const partingShotUrl = normalized
      ? await loadViewerPartingShotUrl(normalized)
      : null;
    const plan = planViewerShareOg({ partingShotUrl });
    const background =
      plan.kind === "scenic" ? await fetchOgImageBuffer(plan.imageUrl) : null;
    const jpeg = await renderShareOgCard({
      background,
      showPin: false,
    });
    return new Response(new Uint8Array(jpeg), { headers: HEADERS });
  } catch (error) {
    console.error(
      "[og] Talisbooks™ card failed:",
      error instanceof Error ? error.message : error,
    );
    return new Response("Open Graph image is unavailable.", { status: 500 });
  }
}
