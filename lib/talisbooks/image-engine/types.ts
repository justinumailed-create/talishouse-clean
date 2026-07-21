export type TalisBooksImageOrientation = "landscape" | "portrait" | "square" | "panorama";

export type TalisBooksImageRole = "original" | "derived_left" | "derived_right";

export type TalisBooksImageProcessingStatus =
  | "pending"
  | "processed"
  | "skipped"
  | "failed";

export type TalisBooksCenterfoldReviewStatus = "pending_preview" | "approved" | "rejected";

export interface TalisBooksImageDimensions {
  width: number;
  height: number;
}

export interface TalisBooksProcessedImageAsset {
  role: TalisBooksImageRole;
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: string;
  name: string;
  storageSuffix: string;
}

export interface TalisBooksCenterfoldPageSpec {
  side: "left" | "right";
  imageRole: "derived_left" | "derived_right";
  fit: "cover";
  bleed: boolean;
}

export interface TalisBooksCenterfoldLayout {
  slug: string;
  name: string;
  description: string;
  layoutType: "spread";
  gridConfig: {
    columns: 2;
    gutter: 0;
    spread: true;
    centerfold: true;
  };
  cssClasses: string;
  config: {
    centerfold: true;
    sourceOrientation: "landscape" | "panorama";
    pages: [TalisBooksCenterfoldPageSpec, TalisBooksCenterfoldPageSpec];
    sourceWidth: number;
    sourceHeight: number;
    leftWidth: number;
    rightWidth: number;
    /** Viewer should crop one original across both pages when available. */
    continuousSpread?: boolean;
    /** Caption belongs on one side of the spread only. */
    captionSide?: "left" | "right";
  };
}

export interface TalisBooksCenterfoldAlignment {
  aligned: boolean;
  originalWidth: number;
  originalHeight: number;
  leftWidth: number;
  rightWidth: number;
  leftHeight: number;
  rightHeight: number;
  seamAligned: boolean;
  heightMatched: boolean;
  widthPreserved: boolean;
}

export interface TalisBooksCenterfoldPagePreview {
  side: "left" | "right";
  role: "derived_left" | "derived_right";
  imageId?: string;
  url?: string;
  width: number;
  height: number;
  name: string;
}

export interface TalisBooksCenterfoldPreview {
  originalImageId?: string;
  originalUrl?: string;
  originalName: string;
  originalWidth: number;
  originalHeight: number;
  orientation: string;
  originalPreserved: true;
  alignment: TalisBooksCenterfoldAlignment;
  left: TalisBooksCenterfoldPagePreview;
  right: TalisBooksCenterfoldPagePreview;
  layout: TalisBooksCenterfoldLayout | null;
  reviewStatus: TalisBooksCenterfoldReviewStatus;
  layoutId?: string | null;
  bookId?: string | null;
}

export interface TalisBooksImageProcessResult {
  orientation: TalisBooksImageOrientation;
  split: boolean;
  original: TalisBooksImageDimensions;
  assets: TalisBooksProcessedImageAsset[];
  centerfoldLayout: TalisBooksCenterfoldLayout | null;
  centerfoldPreview: TalisBooksCenterfoldPreview | null;
  alignment: TalisBooksCenterfoldAlignment | null;
}

export interface TalisBooksPersistedImageRecord {
  id: string;
  role: TalisBooksImageRole;
  url: string;
  storagePath: string;
  width: number;
  height: number;
  parentImageId: string | null;
}

export interface TalisBooksImageProcessPersistResult {
  original: TalisBooksPersistedImageRecord;
  derived: TalisBooksPersistedImageRecord[];
  centerfoldLayoutId: string | null;
  processResult: TalisBooksImageProcessResult;
  centerfoldPreview: TalisBooksCenterfoldPreview | null;
}
