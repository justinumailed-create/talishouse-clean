import { fetchOgImageBuffer } from "@/lib/share/fetch-og-image";
import { loadAllPinsOgScene } from "@/lib/share/load-allpins-og-scene";
import { SHARE_OG_HEIGHT, SHARE_OG_WIDTH } from "@/lib/share/og-card";
import { renderShareOgCard } from "@/lib/share/render-share-og";

/**
 * ALLPINS Mapsite™ landscape share card: Canada satellite + multi-colour pins.
 * Used by `/api/og/mapsite/allpins` and as the right panel of the brand OG.
 */
export async function renderAllPinsOgCard(input?: {
  includeLogo?: boolean;
  width?: number;
  height?: number;
  logo?: Buffer | null;
}): Promise<Buffer> {
  const width = input?.width ?? SHARE_OG_WIDTH;
  const height = input?.height ?? SHARE_OG_HEIGHT;
  const scene = await loadAllPinsOgScene({ width, height });
  const background = await fetchOgImageBuffer(scene.imageryUrl);
  return renderShareOgCard({
    background,
    showPin: false,
    pinOverlays: scene.pinOverlays,
    includeLogo: input?.includeLogo !== false,
    logo: input?.logo,
    width,
    height,
  });
}
