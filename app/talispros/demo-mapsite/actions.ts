"use server";

import { revalidatePath } from "next/cache";
import { createDemoMapSiteWithPinnedEbook } from "@/lib/talispros/demo-mapsite-service";
import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";

export type CreateDemoMapSiteActionResult =
  | {
      ok: true;
      mapsiteId: string;
      code: string;
      mapsiteHref: string;
      publishedHref: string;
      ebookHref: string;
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
