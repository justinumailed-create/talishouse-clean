"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";
import { generateSelfServiceEbook } from "@/lib/talisbooks/self-service-ebook";
import { buildMapSiteAfterBookHref } from "@/lib/talispros/ebook-choice";
import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";

export async function generateSelfServiceEbookAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  viewerUrl?: string;
  mapsiteHref?: string;
  slug?: string;
}> {
  const fastCode = String(formData.get("fastCode") || "").trim();
  const mapsiteId = String(formData.get("mapsiteId") || "").trim() || null;
  const accountType = String(formData.get("accountType") || "").trim() || null;
  const requestId = String(formData.get("requestId") || "").trim() || null;
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const uploadModeRaw = String(formData.get("uploadMode") || "").trim().toLowerCase();
  const uploadMode = uploadModeRaw === "pdf" ? "pdf" : "images";

  const images = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const result = await generateSelfServiceEbook({
    fastCode,
    mapsiteId,
    accountType,
    requestId,
    title,
    description,
    location,
    images,
    uploadMode,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath(ROUTES.TALISBOOKS_LIBRARY);
  revalidatePath(`${ROUTES.TALISBOOKS_VIEWER}/${result.slug}`);
  revalidatePath(MAPSITE_APP_PATH);
  if (fastCode) {
    revalidatePath(`/talispros/admin/mapsites/${fastCode}`);
  }

  const mapsiteHref = buildMapSiteAfterBookHref({
    fastCode,
    mapsiteId: result.mapsiteId || mapsiteId,
    accountType,
    requestId,
    bookSlug: result.slug,
  });

  return {
    success: true,
    viewerUrl: result.viewerUrl,
    mapsiteHref,
    slug: result.slug,
  };
}
