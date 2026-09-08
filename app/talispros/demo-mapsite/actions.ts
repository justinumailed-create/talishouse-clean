"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";
import sharp from "sharp";
import path from "node:path";
import { generateSelfServiceEbook } from "@/lib/talisbooks/self-service-ebook";
import {
  PINNED_TALISBOOK_ASSET_ROOT,
} from "@/lib/talisbooks/library/pinned-catalog";
import {
  createDemoMapSiteWithPinnedEbook,
  loadDemoMapSiteForEbook,
} from "@/lib/talispros/demo-mapsite-service";
import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";

export type CreateDemoMapSiteActionResult =
  | {
      ok: true;
      mapsiteId: string;
      code: string;
      mapsiteHref: string;
      publishedHref: string;
      ebookHref: string;
      generateHref: string;
    }
  | { ok: false; error: string };

export async function createDemoMapSiteAction(formData: FormData): Promise<CreateDemoMapSiteActionResult> {
  const propertyTitle = String(formData.get("propertyTitle") || "").trim();
  const streetAddress = String(formData.get("streetAddress") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const latitude = Number.parseFloat(String(formData.get("latitude") || ""));
  const longitude = Number.parseFloat(String(formData.get("longitude") || ""));
  const mapZoom = Number.parseFloat(String(formData.get("mapZoom") || ""));

  const result = await createDemoMapSiteWithPinnedEbook({
    propertyTitle,
    streetAddress,
    description,
    latitude,
    longitude,
    mapZoom: Number.isFinite(mapZoom) ? mapZoom : null,
  });

  if (!result.ok) return result;

  revalidatePath(MAPSITE_APP_PATH);
  revalidatePath(result.publishedHref);
  revalidatePath(result.ebookHref);

  return result;
}

export type GenerateDemoEbookActionResult =
  | {
      ok: true;
      slug: string;
      viewerUrl: string;
      mapsiteHref: string;
    }
  | { ok: false; error: string };

async function pinnedCoverAsset(
  fileName: "front-cover.jpg" | "back-cover.jpg",
): Promise<{ url: string; width: number; height: number }> {
  const abs = path.join(process.cwd(), "public/talisbooks/pinned", fileName);
  const meta = await sharp(abs).metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  return {
    url: `${PINNED_TALISBOOK_ASSET_ROOT}/${fileName}`,
    width,
    height,
  };
}

export async function generateDemoEbookAction(input: {
  mapsiteId: string;
  optimizedImages: { url: string; width: number; height: number }[];
}): Promise<GenerateDemoEbookActionResult> {
  const mapsite = await loadDemoMapSiteForEbook(input.mapsiteId);
  if (!mapsite) {
    return { ok: false, error: "Demo Mapsite™ not found." };
  }
  if (!input.optimizedImages.length) {
    return { ok: false, error: "Extract and optimize the pinned PDF first." };
  }

  const [frontCover, backCover] = await Promise.all([
    pinnedCoverAsset("front-cover.jpg"),
    pinnedCoverAsset("back-cover.jpg"),
  ]);

  const result = await generateSelfServiceEbook({
    fastCode: mapsite.code,
    mapsiteId: mapsite.mapsiteId,
    accountType: "root",
    title: mapsite.title,
    description: mapsite.description,
    location: mapsite.location,
    optimizedImages: input.optimizedImages,
    uploadMode: "pdf",
    frontCover,
    backCover,
  });

  if (!result.success) {
    return { ok: false, error: result.error };
  }

  revalidatePath(MAPSITE_APP_PATH);
  revalidatePath(`${ROUTES.TALISBOOKS_VIEWER}/${result.slug}`);
  revalidatePath(mapsite.mapsiteHref);

  return {
    ok: true,
    slug: result.slug,
    viewerUrl: result.viewerUrl,
    mapsiteHref: mapsite.mapsiteHref,
  };
}
