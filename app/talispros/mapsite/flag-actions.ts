"use server";

import { revalidatePath } from "next/cache";
import { requireMapSiteEditAccess } from "@/lib/mapsite-edit-auth";
import { readMapSiteIdentity } from "@/lib/talispros/mapsite-owner-customizations-service";
import {
  isFlagAttachmentKind,
  validateFlagAttachment,
} from "@/lib/talispros/mapsite-flag-attachments";
import {
  loadMapSiteFlagAttachments,
  storeMapSiteFlagAttachment,
  type MapSiteFlagAttachments,
} from "@/lib/talispros/mapsite-flag-attachments-service";

type ActionError = { error: string };

/** TEB PDF and TVA summary links for a PIN card (public files). */
export async function loadMapSiteFlagAttachmentsAction(input: {
  fastCode: string;
}): Promise<MapSiteFlagAttachments> {
  return loadMapSiteFlagAttachments(input.fastCode);
}

/**
 * Owner one-click upload from a grey TEB or TVA flag link. Same gate as the
 * other Dashboard saves: paid owner, editor agent or admin.
 */
export async function uploadMapSiteFlagAttachmentAction(
  formData: FormData,
): Promise<{ url: string } | ActionError> {
  const mapsiteId = String(formData.get("mapsiteId") ?? "").trim();
  const fastCode = String(formData.get("fastCode") ?? "").trim().toLowerCase();
  const kind = formData.get("kind");
  const file = formData.get("file");
  if (!fastCode) return { error: "FAST Code™ is required." };
  if (!isFlagAttachmentKind(kind)) return { error: "Choose TEB or TVA." };
  if (!(file instanceof File)) return { error: "Choose a file to attach." };
  try {
    await requireMapSiteEditAccess(fastCode);
  } catch {
    return { error: "Only the Mapsite owner can attach files here." };
  }
  // Files are stored per FAST Code; when a Mapsite id is sent it must match.
  if (mapsiteId) {
    const identity = await readMapSiteIdentity(mapsiteId);
    if (!identity || identity.fastCode !== fastCode) {
      return { error: "FAST Code™ does not match this Mapsite." };
    }
  }
  const checked = validateFlagAttachment(kind, file);
  if (!checked.ok) {
    return {
      error:
        checked.reason === "size"
          ? "That file is too large. The limit is 20 MB."
          : checked.reason === "empty"
            ? "That file is empty."
            : kind === "teb"
              ? "Please choose a PDF file."
              : "Please choose a PDF or text file.",
    };
  }
  const stored = await storeMapSiteFlagAttachment({
    fastCode,
    kind,
    extension: checked.extension,
    body: Buffer.from(await file.arrayBuffer()),
    contentType: file.type,
  });
  if ("error" in stored) return stored;
  revalidatePath(`/talisbooks/fast/${fastCode}`);
  revalidatePath(`/mapsite/${fastCode}`);
  return stored;
}
