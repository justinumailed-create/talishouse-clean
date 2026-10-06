"use server";

import { revalidatePath } from "next/cache";
import {
  getMapSiteEditToolbarState,
  requireMapSiteEditAccess,
} from "@/lib/mapsite-edit-auth";
import { ROUTES } from "@/lib/routes";
import { setAdminEbookPublishStatus } from "@/lib/talisbooks/admin-ebook-pages";
import { deleteTalisBooksLibraryBook } from "@/lib/talisbooks/library/delete-book";
import {
  addOwnerEbookPage,
  deleteOwnerEbookPages,
  loadOwnerEbook,
  reorderOwnerEbookPages,
  updateOwnerEbookDetails,
  updateOwnerEbookPage,
} from "@/lib/talisbooks/owner-ebook-editor";
import type {
  OwnerEbookDetails,
  OwnerEbookPage,
} from "@/lib/talisbooks/owner-ebook-editor-model";
import { isAllowedOwnerImageUrl } from "@/lib/talispros/mapsite-owner-customizations";

type Fail = { success: false; error: string };

/**
 * Ownership is enforced here on every call: owner session + completed
 * activation payment for this FAST Code (or a Mapsite™ admin), and each lib
 * call re-checks talisbooks_books.fast_code before touching a row.
 */
async function authorize(fastCodeRaw: string): Promise<{ fastCode: string } | Fail> {
  const fastCode = fastCodeRaw?.trim().toLowerCase() || "";
  if (!fastCode) return { success: false, error: "FAST Code™ is required." };
  try {
    await requireMapSiteEditAccess(fastCode);
  } catch {
    return { success: false, error: "Only the paid Mapsite™ owner can edit these ebooks." };
  }
  return { fastCode };
}

function revalidateBook(fastCode: string, slug?: string | null) {
  revalidatePath(ROUTES.TALISBOOKS_LIBRARY);
  revalidatePath(`/talisbooks/fast/${fastCode}`);
  revalidatePath(`/talispros/mapsites/${fastCode}/ebooks`, "layout");
  revalidatePath("/talispros/mapsite", "layout");
  if (slug) revalidatePath(`${ROUTES.TALISBOOKS_VIEWER}/${slug}`);
}

function imageAllowed(url: string | null | undefined): boolean {
  return !url || isAllowedOwnerImageUrl(url, process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export async function loadOwnerEbookAction(input: {
  fastCode: string;
  bookId: string;
}): Promise<{ success: true; book: OwnerEbookDetails; pages: OwnerEbookPage[] } | Fail> {
  const auth = await authorize(input.fastCode);
  if ("success" in auth) return auth;
  return loadOwnerEbook(auth.fastCode, input.bookId);
}

export async function saveOwnerEbookDetailsAction(input: {
  fastCode: string;
  bookId: string;
  title: string;
  subtitle: string;
  description: string;
  coverImageUrl?: string | null;
}): Promise<{ success: true } | Fail> {
  const auth = await authorize(input.fastCode);
  if ("success" in auth) return auth;
  if (!imageAllowed(input.coverImageUrl)) {
    return { success: false, error: "Upload the cover here first, then save." };
  }
  const result = await updateOwnerEbookDetails({ ...input, fastCode: auth.fastCode });
  if (result.success) revalidateBook(auth.fastCode);
  return result.success ? { success: true } : result;
}

export async function saveOwnerEbookPageAction(input: {
  fastCode: string;
  bookId: string;
  pageId: string;
  text?: Record<string, string>;
  images?: Record<string, string>;
  captionsEnabled?: boolean;
}): Promise<{ success: true; page: OwnerEbookPage } | Fail> {
  const auth = await authorize(input.fastCode);
  if ("success" in auth) return auth;
  if (Object.values(input.images ?? {}).some((url) => !imageAllowed(url))) {
    return { success: false, error: "Upload images here first, then save." };
  }
  const result = await updateOwnerEbookPage({ ...input, fastCode: auth.fastCode });
  if (result.success) revalidateBook(auth.fastCode);
  return result;
}

export async function reorderOwnerEbookPagesAction(input: {
  fastCode: string;
  bookId: string;
  orderedPageIds: string[];
}): Promise<{ success: true } | Fail> {
  const auth = await authorize(input.fastCode);
  if ("success" in auth) return auth;
  const result = await reorderOwnerEbookPages({ ...input, fastCode: auth.fastCode });
  if (result.success) revalidateBook(auth.fastCode);
  return result.success ? { success: true } : result;
}

export async function deleteOwnerEbookPagesAction(input: {
  fastCode: string;
  bookId: string;
  pageIds: string[];
}): Promise<{ success: true } | Fail> {
  const auth = await authorize(input.fastCode);
  if ("success" in auth) return auth;
  const result = await deleteOwnerEbookPages({ ...input, fastCode: auth.fastCode });
  if (result.success) revalidateBook(auth.fastCode);
  return result.success ? { success: true } : result;
}

export async function addOwnerEbookPageAction(input: {
  fastCode: string;
  bookId: string;
  imageUrl: string;
  title?: string;
  body?: string;
  afterPageId?: string | null;
}): Promise<{ success: true } | Fail> {
  const auth = await authorize(input.fastCode);
  if ("success" in auth) return auth;
  if (!input.imageUrl || !imageAllowed(input.imageUrl)) {
    return { success: false, error: "Upload an image for the new page first." };
  }
  const result = await addOwnerEbookPage({ ...input, fastCode: auth.fastCode });
  if (result.success) revalidateBook(auth.fastCode);
  return result.success ? { success: true } : result;
}

export async function setOwnerEbookPublishAction(input: {
  fastCode: string;
  bookId: string;
  status: "draft" | "published";
}): Promise<{ success: true; status: string } | Fail> {
  const auth = await authorize(input.fastCode);
  if ("success" in auth) return auth;
  const access = await getMapSiteEditToolbarState(auth.fastCode);
  const result = await setAdminEbookPublishStatus({
    fastCode: auth.fastCode,
    bookId: input.bookId,
    status: input.status === "published" ? "published" : "draft",
    // Owners go through Talisbooks™ entitlements; only real admins bypass.
    asAdmin: access.isAdmin,
  });
  if (result.success) revalidateBook(auth.fastCode);
  return result;
}

/** Delete one of the owner's ebooks (confirmed in the UI). */
export async function deleteOwnerEbookAction(input: {
  fastCode: string;
  bookId: string;
}): Promise<{ success: true } | Fail> {
  const auth = await authorize(input.fastCode);
  if ("success" in auth) return auth;
  const result = await deleteTalisBooksLibraryBook({
    bookId: input.bookId,
    // FAST-scoped: the book's fast_code must equal this owner's code.
    scope: { fastCode: auth.fastCode, excludeDemonstrationCatalog: true },
  });
  if (!result.success) return result;
  revalidateBook(auth.fastCode, result.slug);
  return { success: true };
}
