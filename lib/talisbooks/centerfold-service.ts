import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/database.types";
import {
  buildCenterfoldPreview,
  verifyCenterfoldAlignment,
  type TalisBooksCenterfoldPreview,
  type TalisBooksCenterfoldReviewStatus,
} from "./image-engine";

type ImageRow = Database["public"]["Tables"]["talisbooks_images"]["Row"];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function reviewStatusFromMetadata(metadata: Record<string, unknown>): TalisBooksCenterfoldReviewStatus {
  const status = metadata.centerfoldReviewStatus;
  if (status === "approved" || status === "rejected" || status === "pending_preview") {
    return status;
  }
  return "pending_preview";
}

function toCenterfoldPreview(
  original: ImageRow,
  left: ImageRow,
  right: ImageRow,
): TalisBooksCenterfoldPreview {
  const metadata = asRecord(original.metadata);
  const alignment =
    (metadata.alignment as TalisBooksCenterfoldPreview["alignment"] | undefined) ??
    verifyCenterfoldAlignment({
      original: { width: original.width ?? 0, height: original.height ?? 0 },
      left: { width: left.width ?? 0, height: left.height ?? 0 },
      right: { width: right.width ?? 0, height: right.height ?? 0 },
    });

  const layoutId =
    typeof metadata.centerfoldLayoutId === "string" ? metadata.centerfoldLayoutId : null;

  return buildCenterfoldPreview({
    originalImageId: original.id,
    originalUrl: original.url,
    originalName: original.name,
    originalWidth: original.width ?? 0,
    originalHeight: original.height ?? 0,
    orientation: original.orientation ?? "landscape",
    left: {
      imageId: left.id,
      url: left.url,
      width: left.width ?? 0,
      height: left.height ?? 0,
      name: left.name,
    },
    right: {
      imageId: right.id,
      url: right.url,
      width: right.width ?? 0,
      height: right.height ?? 0,
      name: right.name,
    },
    alignment,
    layout: null,
    reviewStatus: reviewStatusFromMetadata(metadata),
    layoutId,
    bookId: original.book_id,
  });
}

/**
 * Lists centerfolds awaiting (or completing) admin preview before publish.
 */
export async function listCenterfoldPreviews(options?: {
  bookId?: string;
  reviewStatus?: TalisBooksCenterfoldReviewStatus;
}): Promise<TalisBooksCenterfoldPreview[]> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("talisbooks_images")
    .select("*")
    .eq("image_role", "original")
    .order("created_at", { ascending: false });

  if (options?.bookId) {
    query = query.eq("book_id", options.bookId);
  }

  const { data: originals, error } = await query;
  if (error || !originals) {
    console.error("[talisbooks] listCenterfoldPreviews:", error?.message);
    return [];
  }

  const previews: TalisBooksCenterfoldPreview[] = [];

  for (const original of originals) {
    const metadata = asRecord(original.metadata);
    if (!metadata.split) {
      continue;
    }

    const { data: derived, error: derivedError } = await supabase
      .from("talisbooks_images")
      .select("*")
      .eq("parent_image_id", original.id);

    if (derivedError || !derived) {
      continue;
    }

    const left = derived.find((row) => row.image_role === "derived_left");
    const right = derived.find((row) => row.image_role === "derived_right");
    if (!left || !right) {
      continue;
    }

    const preview = toCenterfoldPreview(original, left, right);
    if (options?.reviewStatus && preview.reviewStatus !== options.reviewStatus) {
      continue;
    }
    previews.push(preview);
  }

  return previews;
}

export async function setCenterfoldReviewStatus(
  originalImageId: string,
  reviewStatus: TalisBooksCenterfoldReviewStatus,
): Promise<TalisBooksCenterfoldPreview | null> {
  const supabase = getSupabaseAdmin();

  const { data: original, error } = await supabase
    .from("talisbooks_images")
    .select("*")
    .eq("id", originalImageId)
    .eq("image_role", "original")
    .single();

  if (error || !original) {
    throw new Error("Centerfold original image not found.");
  }

  const metadata = {
    ...asRecord(original.metadata),
    centerfoldReviewStatus: reviewStatus,
    reviewedAt: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("talisbooks_images")
    .update({ metadata, updated_at: new Date().toISOString() })
    .eq("id", originalImageId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const previews = await listCenterfoldPreviews();
  return previews.find((preview) => preview.originalImageId === originalImageId) ?? null;
}

/** True when every centerfold for a book has been approved (or none exist). */
export async function bookCenterfoldsApprovedForPublishing(bookId: string): Promise<{
  approved: boolean;
  pending: number;
  rejected: number;
}> {
  const previews = await listCenterfoldPreviews({ bookId });
  const pending = previews.filter((p) => p.reviewStatus === "pending_preview").length;
  const rejected = previews.filter((p) => p.reviewStatus === "rejected").length;

  return {
    approved: pending === 0 && rejected === 0,
    pending,
    rejected,
  };
}
