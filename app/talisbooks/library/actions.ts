"use server";

import { revalidatePath } from "next/cache";
import {
  getMapSiteEbookContext,
  upsertMapSiteEbook,
} from "@/lib/talisbooks/mapsite-ebook-service";
import {
  attachEbookViewerToMapSite,
  buildAbsoluteBookUrl,
  getAdminEbookWorkbench,
  listAdminEbookPages,
  replaceAdminEbookPageImage,
  reorderAdminEbookPages,
  setAdminEbookPublishStatus,
  updateAdminEbookPageFields,
  type AdminEbookPageRow,
} from "@/lib/talisbooks/admin-ebook-pages";
import { sendEbookCompleted } from "@/lib/email";
import { canEditMapSite } from "@/lib/mapsite-edit-auth";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { ROUTES } from "@/lib/routes";

function absoluteEbookUrl(viewerPath: string): string {
  return buildAbsoluteBookUrl(viewerPath);
}

async function requireAdminEbookAccess(fastCode: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (!(await canEditMapSite(fastCode))) {
    return { ok: false, error: "Unauthorized." };
  }
  return { ok: true };
}

function revalidateEbookPaths(fastCode: string, slug?: string) {
  revalidatePath(ROUTES.TALISBOOKS_LIBRARY);
  revalidatePath(`/talispros/admin/mapsites/${fastCode}`);
  revalidatePath(`/talispros/mapsites/${fastCode}/edit`);
  if (slug) {
    revalidatePath(`${ROUTES.TALISBOOKS_VIEWER}/${slug}`);
  }
}

export async function createOrUpdateMapSiteEbookAction(input: {
  fastCode: string;
  title: string;
  subtitle?: string;
  description?: string;
  coverImageUrl?: string | null;
  /** Admin can customize without requiring payment. */
  asAdmin?: boolean;
  /** When true, email the client that their E-Book is ready. */
  notifyClient?: boolean;
  /** Attach viewer URL to MapSite teb_url after save. */
  attachToMapSite?: boolean;
}): Promise<{
  success: boolean;
  error?: string;
  registrationHref?: string;
  slug?: string;
  bookId?: string;
  bookUrl?: string;
  notified?: boolean;
  attached?: boolean;
}> {
  if (input.asAdmin) {
    const access = await requireAdminEbookAccess(input.fastCode);
    if (!access.ok) return { success: false, error: access.error };
  }

  const result = await upsertMapSiteEbook({
    fastCode: input.fastCode,
    title: input.title,
    subtitle: input.subtitle,
    description: input.description,
    coverImageUrl: input.coverImageUrl,
    requirePayment: !input.asAdmin,
    asAdmin: Boolean(input.asAdmin),
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      registrationHref: result.registrationHref,
    };
  }

  const viewerUrl = `${ROUTES.TALISBOOKS_VIEWER}/${result.slug}`;
  let notified = false;
  let attached = false;

  if (
    (input.notifyClient || input.attachToMapSite) &&
    isSupabaseAdminConfigured()
  ) {
    const fastCode = input.fastCode.trim().toLowerCase();
    const context = await getMapSiteEbookContext(fastCode);
    const supabase = getSupabaseAdmin();

    if (input.attachToMapSite || input.notifyClient) {
      const attach = await attachEbookViewerToMapSite({
        fastCode,
        bookId: result.bookId,
      });
      attached = attach.success;
    }

    if (input.notifyClient) {
      let email: string | null = null;
      let recipientName = "there";

      if (context?.mapsiteId) {
        const { data: byMapsite } = await supabase
          .from("build_requests")
          .select("first_name, last_name, email")
          .eq("linked_mapsite_id", context.mapsiteId)
          .order("submitted_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (byMapsite?.email) {
          email = byMapsite.email.trim();
          recipientName =
            `${byMapsite.first_name || ""} ${byMapsite.last_name || ""}`.trim() ||
            recipientName;
        }
      }

      if (!email) {
        const { data: byCode } = await supabase
          .from("build_requests")
          .select("first_name, last_name, email")
          .ilike("requested_fast_code", fastCode)
          .order("submitted_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (byCode?.email) {
          email = byCode.email.trim();
          recipientName =
            `${byCode.first_name || ""} ${byCode.last_name || ""}`.trim() ||
            recipientName;
        }
      }

      if (email) {
        const sendResult = await sendEbookCompleted({
          to: email,
          recipientName,
          fastCode: fastCode.toUpperCase(),
          ebookUrl: absoluteEbookUrl(viewerUrl),
        });
        notified = sendResult.sent;
      }
    }
  }

  revalidateEbookPaths(input.fastCode, result.slug);

  return {
    success: true,
    slug: result.slug,
    bookId: result.bookId,
    bookUrl: absoluteEbookUrl(viewerUrl),
    notified,
    attached,
  };
}

export async function loadAdminEbookWorkbenchAction(fastCode: string): Promise<{
  success: boolean;
  error?: string;
  ebook?: NonNullable<
    Awaited<ReturnType<typeof getAdminEbookWorkbench>>
  >["ebook"];
  pages?: AdminEbookPageRow[];
}> {
  const access = await requireAdminEbookAccess(fastCode);
  if (!access.ok) return { success: false, error: access.error };

  const workbench = await getAdminEbookWorkbench(fastCode);
  if (!workbench) {
    return { success: false, error: "Could not load ebook workbench." };
  }
  return {
    success: true,
    ebook: workbench.ebook,
    pages: workbench.pages,
  };
}

export async function listMapSiteEbookPagesAction(input: {
  fastCode: string;
  bookId: string;
}): Promise<{ success: boolean; error?: string; pages?: AdminEbookPageRow[] }> {
  const access = await requireAdminEbookAccess(input.fastCode);
  if (!access.ok) return { success: false, error: access.error };
  const pages = await listAdminEbookPages(input.bookId);
  return { success: true, pages };
}

export async function updateMapSiteEbookPageAction(input: {
  fastCode: string;
  bookId: string;
  pageId: string;
  title?: string;
  body?: string;
}): Promise<{ success: boolean; error?: string }> {
  const access = await requireAdminEbookAccess(input.fastCode);
  if (!access.ok) return { success: false, error: access.error };
  const result = await updateAdminEbookPageFields(input);
  if (!result.success) return result;
  revalidateEbookPaths(input.fastCode);
  return { success: true };
}

export async function replaceMapSiteEbookPageImageAction(input: {
  fastCode: string;
  bookId: string;
  pageId: string;
  imageUrl?: string | null;
  formData?: FormData;
}): Promise<{ success: boolean; error?: string; imageUrl?: string }> {
  const access = await requireAdminEbookAccess(input.fastCode);
  if (!access.ok) return { success: false, error: access.error };

  const file = input.formData?.get("image");
  const imageFile = file instanceof File && file.size > 0 ? file : null;

  const result = await replaceAdminEbookPageImage({
    fastCode: input.fastCode,
    bookId: input.bookId,
    pageId: input.pageId,
    imageUrl: input.imageUrl,
    imageFile,
  });
  if (!result.success) return result;
  revalidateEbookPaths(input.fastCode);
  return { success: true, imageUrl: result.imageUrl };
}

export async function reorderMapSiteEbookPagesAction(input: {
  fastCode: string;
  bookId: string;
  orderedPageIds: string[];
}): Promise<{ success: boolean; error?: string }> {
  const access = await requireAdminEbookAccess(input.fastCode);
  if (!access.ok) return { success: false, error: access.error };
  const result = await reorderAdminEbookPages(input);
  if (!result.success) return result;
  revalidateEbookPaths(input.fastCode);
  return { success: true };
}

export async function publishMapSiteEbookAction(input: {
  fastCode: string;
  bookId: string;
  status: "draft" | "published";
}): Promise<{ success: boolean; error?: string; status?: string }> {
  const access = await requireAdminEbookAccess(input.fastCode);
  if (!access.ok) return { success: false, error: access.error };

  const result = await setAdminEbookPublishStatus({
    ...input,
    asAdmin: true,
  });
  if (!result.success) return result;
  revalidateEbookPaths(input.fastCode);
  return { success: true, status: result.status };
}

export async function attachMapSiteEbookAction(input: {
  fastCode: string;
  bookId: string;
}): Promise<{
  success: boolean;
  error?: string;
  tebUrl?: string;
  bookUrl?: string;
}> {
  const access = await requireAdminEbookAccess(input.fastCode);
  if (!access.ok) return { success: false, error: access.error };
  const result = await attachEbookViewerToMapSite(input);
  if (!result.success) return result;
  revalidateEbookPaths(input.fastCode);
  return {
    success: true,
    tebUrl: result.tebUrl,
    bookUrl: absoluteEbookUrl(result.viewerPath),
  };
}
