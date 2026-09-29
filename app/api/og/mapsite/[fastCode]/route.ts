import { fetchOgImageBuffer } from "@/lib/share/fetch-og-image";
import { loadMapsiteOgLocation } from "@/lib/share/load-mapsite-og-location";
import { loadMapsiteScenicBackgroundUrl } from "@/lib/share/load-share-og-scene";
import {
  CLAIMED_MAPSITE_OG_LOGO_PATH,
  CLAIMED_MAPSITE_OG_PIN_COLOR,
  esriWorldImageryUrl,
  planMapsiteShareOg,
} from "@/lib/share/og-card";
import { renderAllPinsOgCard } from "@/lib/share/render-allpins-og";
import { readShareOgLogo, renderShareOgCard } from "@/lib/share/render-share-og";
import { isAllPinsFastCode } from "@/lib/talispros/allpins-mapsite-constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Content-Type": "image/jpeg",
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fastCode: string }> },
) {
  const { fastCode } = await params;
  const code = fastCode?.trim() || "";

  try {
    if (isAllPinsFastCode(code)) {
      const jpeg = await renderAllPinsOgCard();
      return new Response(new Uint8Array(jpeg), { headers: HEADERS });
    }

    const location = code ? await loadMapsiteOgLocation(code) : null;
    const scenicImageUrl = location
      ? null
      : code
        ? await loadMapsiteScenicBackgroundUrl(code)
        : null;
    const plan = planMapsiteShareOg({
      hasCoordinates: Boolean(location),
      scenicImageUrl,
    });

    let background: Buffer | null = null;
    if (plan.kind === "satellite" && location) {
      background = await fetchOgImageBuffer(esriWorldImageryUrl(location));
      if (!background && code) {
        const scenic = await loadMapsiteScenicBackgroundUrl(code);
        if (scenic) background = await fetchOgImageBuffer(scenic);
      }
    } else if (plan.kind === "scenic") {
      background = await fetchOgImageBuffer(plan.imageUrl);
    }

    const jpeg = await renderShareOgCard({
      background,
      showPin: true,
      pinColor: CLAIMED_MAPSITE_OG_PIN_COLOR,
      // Individual Mapsite™ cards use the circular Windswept badge. Keep the
      // ALLPINS branch above and unrelated Talisbooks™ cards on their existing logo.
      logo: await readShareOgLogo(CLAIMED_MAPSITE_OG_LOGO_PATH),
    });
    return new Response(new Uint8Array(jpeg), { headers: HEADERS });
  } catch (error) {
    console.error(
      "[og] Mapsite™ card failed:",
      error instanceof Error ? error.message : error,
    );
    return new Response("Open Graph image is unavailable.", { status: 500 });
  }
}
