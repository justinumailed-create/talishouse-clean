"use server";

import { revalidatePath } from "next/cache";
import { requireMapSiteEditAccess } from "@/lib/mapsite-edit-auth";
import { getTalisBooksBookshelf } from "@/lib/talisbooks/library";
import { displayShelfBookTitle } from "@/lib/talisbooks/book-title";
import {
  isAllowedOwnerImageUrl,
  MAPSITE_PARTNER_TEXT_LIMITS,
  normalizeBookshelfOrder,
  normalizePartnerText,
  type MapSiteBrandingField,
  type MapSitePartnerTextField,
  type MapSiteOwnerCustomizations,
} from "@/lib/talispros/mapsite-owner-customizations";
import {
  readMapSiteIdentity,
  saveMapSiteOwnerCustomizations,
} from "@/lib/talispros/mapsite-owner-customizations-service";

type ActionError = { error: string };

export type OwnerShelfBook = {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  coverGradient: string;
  publishStatus: string;
};

function revalidateOwnerSurfaces(fastCode: string) {
  const code = fastCode.trim().toLowerCase();
  revalidatePath("/talispros/mapsite", "layout");
  if (!code) return;
  revalidatePath(`/mapsite/${code}`);
  revalidatePath(`/mapsite/${code}/map`);
  revalidatePath(`/talispros/mapsites/${code}`);
  revalidatePath(`/talisbooks/fast/${code}`);
}

/**
 * Same gate as the PIN Dashboard: owner session + completed activation payment,
 * or a Mapsite™ admin. The mapsiteId ↔ FAST Code pairing is re-read from the DB.
 */
async function authorizeOwner(input: {
  mapsiteId: string;
  fastCode: string;
}): Promise<{ mapsiteId: string; fastCode: string } | ActionError> {
  const fastCode = input.fastCode.trim().toLowerCase();
  if (!fastCode || !input.mapsiteId.trim()) {
    return { error: "Mapsite™ and FAST Code™ are required." };
  }
  try {
    await requireMapSiteEditAccess(fastCode);
  } catch {
    return { error: "Only the paid Mapsite™ owner can change this." };
  }
  const identity = await readMapSiteIdentity(input.mapsiteId);
  if (!identity) return { error: "Mapsite™ was not found." };
  if (identity.fastCode !== fastCode) {
    return { error: "FAST Code™ does not match this Mapsite™." };
  }
  return { mapsiteId: identity.id, fastCode };
}

/** Save or reset (url = null) the left-card logo or partner photo override. */
export async function saveMapSiteBrandingAction(input: {
  mapsiteId: string;
  fastCode: string;
  field: MapSiteBrandingField;
  url: string | null;
}): Promise<{ customizations: MapSiteOwnerCustomizations } | ActionError> {
  const auth = await authorizeOwner(input);
  if ("error" in auth) return auth;
  if (input.field !== "logo" && input.field !== "partnerImage") {
    return { error: "Unknown image slot." };
  }

  const url = input.url?.trim() || null;
  if (url && !isAllowedOwnerImageUrl(url, process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    return { error: "Upload the image here first, then save." };
  }

  const column = input.field === "logo" ? "logo_url" : "partner_image_url";
  const saved = await saveMapSiteOwnerCustomizations({
    mapsiteId: auth.mapsiteId,
    fastCode: auth.fastCode,
    patch: { [column]: url },
  });
  if (!saved.customizations) return { error: saved.error || "Could not save." };
  revalidateOwnerSurfaces(auth.fastCode);
  return { customizations: saved.customizations };
}

/** Save or reset (value = null) the left-card partner name or tagline. */
export async function saveMapSitePartnerTextAction(input: {
  mapsiteId: string;
  fastCode: string;
  field: MapSitePartnerTextField;
  value: string | null;
}): Promise<{ customizations: MapSiteOwnerCustomizations } | ActionError> {
  const auth = await authorizeOwner(input);
  if ("error" in auth) return auth;
  if (input.field !== "partnerName" && input.field !== "partnerTagline") {
    return { error: "Unknown card field." };
  }
  const normalized = normalizePartnerText(input.value, input.field);
  if (normalized.tooLong) {
    const label = input.field === "partnerName" ? "Name" : "Tagline";
    return {
      error: `${label} must be ${MAPSITE_PARTNER_TEXT_LIMITS[input.field]} characters or fewer.`,
    };
  }
  if (input.value !== null && !normalized.value) {
    return { error: "Enter some text, or use Reset to default." };
  }
  const column = input.field === "partnerName" ? "partner_name" : "partner_tagline";
  const saved = await saveMapSiteOwnerCustomizations({
    mapsiteId: auth.mapsiteId,
    fastCode: auth.fastCode,
    patch: { [column]: normalized.value },
  });
  if (!saved.customizations) return { error: saved.error || "Could not save." };
  revalidateOwnerSurfaces(auth.fastCode);
  return { customizations: saved.customizations };
}

async function loadShelfBooks(fastCode: string): Promise<OwnerShelfBook[]> {
  const shelf = await getTalisBooksBookshelf({ fastCode });
  return shelf.books
    .filter((book) => !book.decorative)
    .map((book) => ({
      id: book.id,
      slug: book.slug,
      title: displayShelfBookTitle(book.title) || book.title || "Untitled",
      coverImageUrl: book.coverImageUrl,
      coverGradient: book.coverGradient,
      publishStatus: book.publishStatus,
    }));
}

/** Owner's FAST-Code shelf in its current (saved) order. */
export async function loadOwnerBookshelfAction(input: {
  mapsiteId: string;
  fastCode: string;
}): Promise<{ books: OwnerShelfBook[] } | ActionError> {
  const auth = await authorizeOwner(input);
  if ("error" in auth) return auth;
  return { books: await loadShelfBooks(auth.fastCode) };
}

/** Persist a drag-and-drop order. Only ids on this FAST Code shelf are kept. */
export async function saveBookshelfOrderAction(input: {
  mapsiteId: string;
  fastCode: string;
  orderedBookIds: string[];
}): Promise<{ books: OwnerShelfBook[] } | ActionError> {
  const auth = await authorizeOwner(input);
  if ("error" in auth) return auth;

  const current = await loadShelfBooks(auth.fastCode);
  const allowed = new Set(current.map((book) => book.id));
  const ordered = normalizeBookshelfOrder(input.orderedBookIds).filter((id) =>
    allowed.has(id),
  );
  // Keep any shelf books the client did not send, at the end, in current order.
  for (const book of current) {
    if (!ordered.includes(book.id)) ordered.push(book.id);
  }

  const saved = await saveMapSiteOwnerCustomizations({
    mapsiteId: auth.mapsiteId,
    fastCode: auth.fastCode,
    patch: { bookshelf_order: ordered },
  });
  if (!saved.customizations) return { error: saved.error || "Could not save order." };
  revalidateOwnerSurfaces(auth.fastCode);
  return { books: await loadShelfBooks(auth.fastCode) };
}
