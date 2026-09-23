"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";
import type { OptimizedEbookImageAsset } from "@/lib/talisbooks/auto-draft-ebook";
import { generateSelfServiceEbook } from "@/lib/talisbooks/self-service-ebook";
import {
  createDemoMapSiteWithPinnedEbook,
  loadDemoMapSiteForEbook,
} from "@/lib/talispros/demo-mapsite-service";
import {
  pathnameForRevalidate,
  publicDemoGenerateError,
} from "@/lib/talispros/demo-mapsite";
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
  revalidatePath(pathnameForRevalidate(result.publishedHref));
  revalidatePath(pathnameForRevalidate(result.ebookHref));

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

export async function generateDemoEbookAction(input: {
  mapsiteId: string;
  optimizedImages: OptimizedEbookImageAsset[];
  frontCover: OptimizedEbookImageAsset;
  backCover: OptimizedEbookImageAsset;
}): Promise<GenerateDemoEbookActionResult> {
  try {
    const mapsite = await loadDemoMapSiteForEbook(input.mapsiteId);
    if (!mapsite) {
      return { ok: false, error: "Demo Mapsite™ not found." };
    }
    if (!input.optimizedImages.length) {
      return { ok: false, error: "Extract and optimize the pinned PDF first." };
    }
    if (!input.frontCover?.url.trim() || !input.backCover?.url.trim()) {
      return {
        ok: false,
        error:
          "Page 1 of the PDF must become the wrap cover (left = back, right = front).",
      };
    }

    const result = await generateSelfServiceEbook({
      fastCode: mapsite.code,
      mapsiteId: mapsite.mapsiteId,
      accountType: "root",
      title: mapsite.title,
      description: mapsite.description,
      location: mapsite.location,
      optimizedImages: input.optimizedImages,
      uploadMode: "pdf",
      frontCover: input.frontCover,
      backCover: input.backCover,
    });

    if (!result.success) {
      return { ok: false, error: result.error };
    }

    revalidatePath(MAPSITE_APP_PATH);
    revalidatePath(
      pathnameForRevalidate(`${ROUTES.TALISBOOKS_VIEWER}/${result.slug}`),
    );
    revalidatePath(
      pathnameForRevalidate(`${ROUTES.TALISBOOKS}/fast/${mapsite.code}`),
    );

    return {
      ok: true,
      slug: result.slug,
      viewerUrl: result.viewerUrl,
      mapsiteHref: mapsite.mapsiteHref,
    };
  } catch (error) {
    console.error("[generateDemoEbookAction]", error);
    return {
      ok: false,
      error: publicDemoGenerateError(error),
    };
  }
}
