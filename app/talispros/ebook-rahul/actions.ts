"use server";

import { revalidatePath } from "next/cache";
import { submitRahulEbookAssistRequest } from "@/lib/talisbooks/rahul-ebook-assist";
import { buildClaimedMapSitePath, MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";

export async function submitRahulEbookAssistAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  requestId?: string;
  continueHref?: string;
  previewUrl?: string;
}> {
  const fastCode = String(formData.get("fastCode") || "").trim() || null;
  const mapsiteId = String(formData.get("mapsiteId") || "").trim() || null;
  const accountType = String(formData.get("accountType") || "").trim() || null;
  const requestId = String(formData.get("requestId") || "").trim() || null;

  const images = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const agentPhotoRaw = formData.get("agentPhoto");
  const logoRaw = formData.get("logo");

  const result = await submitRahulEbookAssistRequest({
    fastCode,
    mapsiteId,
    accountType,
    requestId,
    firstName: String(formData.get("firstName") || "").trim() || null,
    lastName: String(formData.get("lastName") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    propertyTitle: String(formData.get("propertyTitle") || ""),
    description: String(formData.get("description") || ""),
    location: String(formData.get("location") || ""),
    agentPhoto:
      agentPhotoRaw instanceof File && agentPhotoRaw.size > 0
        ? agentPhotoRaw
        : null,
    logo: logoRaw instanceof File && logoRaw.size > 0 ? logoRaw : null,
    images,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/talispros/marketing/admin");
  revalidatePath("/admin/marketing");
  if (result.fastCode) {
    revalidatePath(`/talispros/admin/mapsites/${result.fastCode}`);
  }
  if (result.previewUrl) {
    revalidatePath(result.previewUrl);
  }

  // Prefer the draft preview URL when auto-generation succeeded.
  if (result.previewUrl) {
    return {
      success: true,
      requestId: result.requestId,
      previewUrl: result.previewUrl,
      continueHref: result.previewUrl,
    };
  }

  const code = result.fastCode;
  const continueHref =
    code && code.toLowerCase() !== "demo"
      ? `${buildClaimedMapSitePath({
          fastCode: code,
          accountType,
        })}?ebook=rahul`
      : `${MAPSITE_APP_PATH}?claimed=1&view=pin&ebook=rahul${
          mapsiteId ? `&mapsiteId=${encodeURIComponent(mapsiteId)}` : ""
        }${result.requestId ? `&requestId=${encodeURIComponent(result.requestId)}` : ""}`;

  return {
    success: true,
    requestId: result.requestId,
    continueHref,
  };
}
