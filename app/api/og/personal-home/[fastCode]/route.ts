import sharp from "sharp";
import { loadPublishedMapSiteView } from "@/components/mapsite/PublishedMapSiteView";
import { fetchOgImageBuffer } from "@/lib/share/fetch-og-image";
import { CLAIMED_MAPSITE_OG_LOGO_PATH } from "@/lib/share/og-card";
import { readShareOgLogo, renderShareOgCard } from "@/lib/share/render-share-og";
import { isAllPinsFastCode } from "@/lib/talispros/allpins-mapsite-constants";
import { isAllowedOwnerImageUrl } from "@/lib/talispros/mapsite-owner-customizations";
import { HOME_OWNERSHIP_BG_SRC } from "@/lib/talispros/ownership-models";
import { personalHomeDefaultImage } from "@/lib/talispros/personal-home";
import { loadPersonalHomeContent } from "@/lib/talispros/personal-home-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Content-Type": "image/jpeg",
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

async function decodable(buffer: Buffer | null): Promise<Buffer | null> {
  if (!buffer) return null;
  return (await sharp(buffer).metadata().then(() => true, () => false)) ? buffer : null;
}

/** Share card for /talispros/home/<code>: the owner photo + Windswept badge. */
async function backgroundFor(code: string): Promise<Buffer | null> {
  if (!code || isAllPinsFastCode(code)) return null;
  const saved = await loadPersonalHomeContent(code);
  if (
    saved.imageUrl &&
    isAllowedOwnerImageUrl(saved.imageUrl, process.env.NEXT_PUBLIC_SUPABASE_URL)
  ) {
    const owner = await decodable(await fetchOgImageBuffer(saved.imageUrl));
    if (owner) return owner;
  }
  const view = await loadPublishedMapSiteView(code).catch(() => null);
  const url = view
    ? personalHomeDefaultImage({
        profileImageUrl: view.profileImageUrl,
        headerImageUrl: view.headerImageUrl,
        galleryImages: view.galleryImages,
        fallback: HOME_OWNERSHIP_BG_SRC,
      })
    : HOME_OWNERSHIP_BG_SRC;
  const image = await decodable(await fetchOgImageBuffer(url));
  if (image) return image;
  return decodable(await fetchOgImageBuffer(HOME_OWNERSHIP_BG_SRC));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fastCode: string }> },
) {
  const { fastCode } = await params;
  const code = decodeURIComponent(fastCode || "").trim().toLowerCase();
  try {
    const jpeg = await renderShareOgCard({
      background: await backgroundFor(code),
      showPin: false,
      logo: await readShareOgLogo(CLAIMED_MAPSITE_OG_LOGO_PATH),
    });
    return new Response(new Uint8Array(jpeg), { headers: HEADERS });
  } catch (error) {
    console.error(
      "[og] Personal home card failed:",
      error instanceof Error ? error.message : error,
    );
    return new Response("Open Graph image is unavailable.", { status: 500 });
  }
}
