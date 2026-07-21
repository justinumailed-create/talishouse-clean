import type {
  TalisBooksCenterfoldAlignment,
  TalisBooksCenterfoldLayout,
  TalisBooksCenterfoldPreview,
  TalisBooksCenterfoldReviewStatus,
} from "./types";

export type { TalisBooksCenterfoldReviewStatus };

export interface BuildCenterfoldPreviewInput {
  originalName: string;
  originalWidth: number;
  originalHeight: number;
  orientation: string;
  left: {
    imageId?: string;
    url?: string;
    width: number;
    height: number;
    name: string;
  };
  right: {
    imageId?: string;
    url?: string;
    width: number;
    height: number;
    name: string;
  };
  alignment: TalisBooksCenterfoldAlignment;
  layout: TalisBooksCenterfoldLayout | null;
  reviewStatus?: TalisBooksCenterfoldReviewStatus;
  originalImageId?: string;
  originalUrl?: string;
  layoutId?: string | null;
  bookId?: string | null;
}

export function buildCenterfoldPreview(
  input: BuildCenterfoldPreviewInput,
): TalisBooksCenterfoldPreview {
  return {
    originalImageId: input.originalImageId,
    originalUrl: input.originalUrl,
    originalName: input.originalName,
    originalWidth: input.originalWidth,
    originalHeight: input.originalHeight,
    orientation: input.orientation,
    originalPreserved: true,
    alignment: input.alignment,
    left: {
      side: "left",
      role: "derived_left",
      imageId: input.left.imageId,
      url: input.left.url,
      width: input.left.width,
      height: input.left.height,
      name: input.left.name,
    },
    right: {
      side: "right",
      role: "derived_right",
      imageId: input.right.imageId,
      url: input.right.url,
      width: input.right.width,
      height: input.right.height,
      name: input.right.name,
    },
    layout: input.layout,
    reviewStatus: input.reviewStatus ?? "pending_preview",
    layoutId: input.layoutId ?? null,
    bookId: input.bookId ?? null,
  };
}
