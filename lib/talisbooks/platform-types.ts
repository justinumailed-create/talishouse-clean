import type { TalisBooksAccountType, TalisBooksPublishStatus } from "./types";

export type TalisBooksMediaType = "image" | "video" | "audio" | "document";
export type TalisBooksAssetType =
  | "image"
  | "icon"
  | "logo"
  | "font"
  | "overlay"
  | "template"
  | "export";

export type TalisBooksAnalyticsEvent =
  | "view"
  | "page_turn"
  | "page_view"
  | "share"
  | "export"
  | "qr_scan"
  | "audio_play";

export type TalisBooksSettingsScope = "book" | "platform";

export interface TalisBooksBookMedia {
  id: string;
  bookId: string;
  pageId: string | null;
  mediaType: TalisBooksMediaType;
  name: string;
  url: string;
  altText: string;
  caption: string;
  width: number | null;
  height: number | null;
  mimeType: string;
  fileSize: number | null;
  storagePath: string;
  sortOrder: number;
  isPrimary: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TalisBooksBookAsset {
  id: string;
  bookId: string;
  assetType: TalisBooksAssetType;
  name: string;
  url: string;
  fileSize: number | null;
  mimeType: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface TalisBooksBookTheme {
  id: string;
  bookId: string;
  name: string;
  isActive: boolean;
  primaryColor: string;
  accentColor: string;
  typographyScale: string;
  pageStyle: string;
  customCss: string;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TalisBooksBookAnalyticsEvent {
  id: string;
  bookId: string;
  pageId: string | null;
  eventType: TalisBooksAnalyticsEvent;
  sessionId: string | null;
  referrer: string;
  userAgent: string;
  metadata: Record<string, unknown>;
  recordedAt: string;
}

export interface TalisBooksBookVersion {
  id: string;
  bookId: string;
  versionNumber: number;
  label: string;
  snapshot: Record<string, unknown>;
  publishStatus: TalisBooksPublishStatus;
  createdBy: string | null;
  createdAt: string;
}

export interface TalisBooksBookSettings {
  id: string;
  bookId: string | null;
  scope: TalisBooksSettingsScope;
  viewerAutoTurnMs: number;
  viewerPauseOnHover: boolean;
  narrationEnabled: boolean;
  defaultLocale: string;
  config: Record<string, unknown>;
  updatedAt: string;
}

export interface TalisBooksEcosystemBook {
  bookId: string;
  slug: string;
  title: string;
  subtitle: string;
  publishStatus: TalisBooksPublishStatus;
  pageCount: number;
  isPublic: boolean;
  mapsiteId: string | null;
  accountId: string | null;
  fastCode: string | null;
  accountType: TalisBooksAccountType;
  parentBookId: string | null;
}
