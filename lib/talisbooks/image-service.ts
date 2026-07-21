import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/lib/database.types";
import {
  TALISBOOKS_IMAGE_STORAGE_BUCKET,
  detectImageOrientation,
  processImageBuffer,
  type TalisBooksImageProcessPersistResult,
  type TalisBooksImageRole,
  type TalisBooksPersistedImageRecord,
} from "./image-engine";

type ImageInsert = Database["public"]["Tables"]["talisbooks_images"]["Insert"];
type ImageRow = Database["public"]["Tables"]["talisbooks_images"]["Row"];
type LayoutInsert = Database["public"]["Tables"]["talisbooks_layouts"]["Insert"];

export interface ProcessAndStoreImageInput {
  buffer: Buffer;
  name: string;
  mimeType: string;
  bookId?: string | null;
  authorId?: string | null;
  altText?: string;
  caption?: string;
}

function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toPersistedImageRecord(
  row: ImageRow,
  role: TalisBooksImageRole,
): TalisBooksPersistedImageRecord {
  return {
    id: row.id,
    role,
    url: row.url,
    storagePath: row.storage_path,
    width: row.width ?? 0,
    height: row.height ?? 0,
    parentImageId: row.parent_image_id,
  };
}

async function uploadImageAsset(
  storagePath: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from(TALISBOOKS_IMAGE_STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error("[talisbooks] uploadImageAsset error:", error.message);
    return null;
  }

  const { data } = supabase.storage.from(TALISBOOKS_IMAGE_STORAGE_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl ?? null;
}

function buildStoragePath(
  bookId: string | null | undefined,
  imageId: string,
  suffix: string,
  extension: string,
): string {
  const scope = bookId ?? "uploads";
  return `${scope}/${imageId}/${suffix}.${extension}`;
}

export async function processAndStoreImage(
  input: ProcessAndStoreImageInput,
): Promise<TalisBooksImageProcessPersistResult | null> {
  const supabase = getSupabaseAdmin();
  const processResult = await processImageBuffer(input.buffer, {
    sourceName: input.name,
    outputMimeType: input.mimeType,
  });

  const orientation = detectImageOrientation(processResult.original);
  const originalExtension = extensionForMimeType(input.mimeType);
  const originalId = crypto.randomUUID();
  const originalStoragePath = buildStoragePath(
    input.bookId,
    originalId,
    "original",
    originalExtension,
  );

  const originalUrl = await uploadImageAsset(originalStoragePath, input.buffer, input.mimeType);
  if (!originalUrl) {
    return null;
  }

  const originalInsert: ImageInsert = {
    id: originalId,
    book_id: input.bookId ?? null,
    author_id: input.authorId ?? null,
    name: input.name,
    url: originalUrl,
    alt_text: input.altText ?? "",
    caption: input.caption ?? "",
    width: processResult.original.width,
    height: processResult.original.height,
    mime_type: input.mimeType,
    file_size: input.buffer.byteLength,
    storage_path: originalStoragePath,
    image_role: "original",
    orientation,
    processing_status: processResult.split ? "processed" : "skipped",
    metadata: {
      processor: "talisbooks-image-engine",
      split: processResult.split,
      centerfoldReviewStatus: processResult.split ? "pending_preview" : undefined,
      alignment: processResult.alignment,
      originalPreserved: true,
    },
  };

  const { data: originalRow, error: originalError } = await supabase
    .from("talisbooks_images")
    .insert(originalInsert)
    .select("*")
    .single();

  if (originalError || !originalRow) {
    console.error("[talisbooks] processAndStoreImage original insert:", originalError?.message);
    return null;
  }

  const derivedRecords: TalisBooksPersistedImageRecord[] = [];
  let centerfoldLayoutId: string | null = null;

  if (processResult.split && processResult.centerfoldLayout) {
    const layoutInsert: LayoutInsert = {
      slug: processResult.centerfoldLayout.slug,
      name: processResult.centerfoldLayout.name,
      description: processResult.centerfoldLayout.description,
      layout_type: processResult.centerfoldLayout.layoutType,
      grid_config: processResult.centerfoldLayout.gridConfig,
      css_classes: processResult.centerfoldLayout.cssClasses,
      config: processResult.centerfoldLayout.config,
      is_system: true,
      is_active: true,
    };

    const { data: layoutRow, error: layoutError } = await supabase
      .from("talisbooks_layouts")
      .insert(layoutInsert)
      .select("id")
      .single();

    if (layoutError) {
      console.error("[talisbooks] processAndStoreImage layout insert:", layoutError.message);
    } else {
      centerfoldLayoutId = layoutRow?.id ?? null;
      await supabase
        .from("talisbooks_images")
        .update({
          metadata: {
            ...asRecord(originalRow.metadata),
            processor: "talisbooks-image-engine",
            split: true,
            centerfoldReviewStatus: "pending_preview",
            centerfoldLayoutId,
            alignment: processResult.alignment,
            originalPreserved: true,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", originalId);
    }

    for (const asset of processResult.assets) {
      const derivedId = crypto.randomUUID();
      const derivedExtension = extensionForMimeType(asset.mimeType);
      const derivedStoragePath = buildStoragePath(
        input.bookId,
        originalId,
        asset.storageSuffix,
        derivedExtension,
      );

      const derivedUrl = await uploadImageAsset(derivedStoragePath, asset.buffer, asset.mimeType);
      if (!derivedUrl) {
        continue;
      }

      const derivedInsert: ImageInsert = {
        id: derivedId,
        book_id: input.bookId ?? null,
        author_id: input.authorId ?? null,
        parent_image_id: originalId,
        name: asset.name,
        url: derivedUrl,
        alt_text: input.altText ?? "",
        caption: asset.role === "derived_right" ? (input.caption ?? "") : "",
        width: asset.width,
        height: asset.height,
        mime_type: asset.mimeType,
        file_size: asset.buffer.byteLength,
        storage_path: derivedStoragePath,
        image_role: asset.role,
        orientation: detectImageOrientation({ width: asset.width, height: asset.height }),
        processing_status: "processed",
        metadata: {
          processor: "talisbooks-image-engine",
          parentImageId: originalId,
          centerfoldLayoutId,
        },
      };

      const { data: derivedRow, error: derivedError } = await supabase
        .from("talisbooks_images")
        .insert(derivedInsert)
        .select("*")
        .single();

      if (derivedError || !derivedRow) {
        console.error("[talisbooks] processAndStoreImage derived insert:", derivedError?.message);
        continue;
      }

      derivedRecords.push(toPersistedImageRecord(derivedRow, asset.role));
    }
  }

  return {
    original: toPersistedImageRecord(originalRow, "original"),
    derived: derivedRecords,
    centerfoldLayoutId,
    processResult,
    centerfoldPreview: processResult.centerfoldPreview
      ? {
          ...processResult.centerfoldPreview,
          originalImageId: originalId,
          originalUrl,
          layoutId: centerfoldLayoutId,
          bookId: input.bookId ?? null,
          left: {
            ...processResult.centerfoldPreview.left,
            imageId: derivedRecords.find((d) => d.role === "derived_left")?.id,
            url: derivedRecords.find((d) => d.role === "derived_left")?.url,
          },
          right: {
            ...processResult.centerfoldPreview.right,
            imageId: derivedRecords.find((d) => d.role === "derived_right")?.id,
            url: derivedRecords.find((d) => d.role === "derived_right")?.url,
          },
        }
      : null,
  };
}
