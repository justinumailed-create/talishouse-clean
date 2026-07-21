/** PublishStatus — book lifecycle states (future-ready workflow). */
export type TalisBooksPublishStatus =
  | "draft"
  | "in_review"
  | "scheduled"
  | "published"
  | "archived"
  | "withdrawn";

export type TalisBooksAccountType = "root" | "derivative" | "adpro";

export type TalisBooksTemplateType = "book" | "page" | "cover" | "section" | "spread";
export type TalisBooksLayoutType = "cover" | "single" | "spread" | "gallery" | "custom";

export type TalisBooksPageRole = "cover" | "agent_brokerage" | "property_content";

export type TalisBooksContentBlockType =
  | "cover"
  | "agent"
  | "brokerage"
  | "property_photo"
  | "property_content"
  | "text"
  | "image";

export type TalisBooksImageCategory =
  | "property"
  | "agent"
  | "brokerage"
  | "cover"
  | "other";

export type TalisBooksImageOrientation = "landscape" | "portrait" | "square";
export type TalisBooksImageRole = "original" | "derived_left" | "derived_right";
export type TalisBooksImageProcessingStatus =
  | "pending"
  | "processed"
  | "skipped"
  | "failed";

export interface TalisBooksAuthor {
  id: string;
  slug: string;
  name: string;
  email: string;
  bio: string;
  avatarUrl: string;
  accountId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TalisBooksTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  templateType: TalisBooksTemplateType;
  previewUrl: string;
  config: Record<string, unknown>;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TalisBooksLayout {
  id: string;
  slug: string;
  name: string;
  description: string;
  layoutType: TalisBooksLayoutType;
  gridConfig: Record<string, unknown>;
  cssClasses: string;
  config: Record<string, unknown>;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TalisBooksImage {
  id: string;
  authorId: string | null;
  bookId: string | null;
  parentImageId: string | null;
  imageRole: TalisBooksImageRole;
  orientation: TalisBooksImageOrientation | null;
  processingStatus: TalisBooksImageProcessingStatus;
  name: string;
  url: string;
  altText: string;
  caption: string;
  width: number | null;
  height: number | null;
  mimeType: string;
  fileSize: number | null;
  storagePath: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TalisBooksBook {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  publishStatus: TalisBooksPublishStatus;
  authorId: string | null;
  templateId: string | null;
  coverImageId: string | null;
  accountId: string | null;
  mapsiteId: string | null;
  fastCode: string | null;
  parentBookId: string | null;
  accountType: TalisBooksAccountType;
  locale: string;
  pageCount: number;
  isPublic: boolean;
  publishedAt: string | null;
  scheduledAt: string | null;
  settings: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TalisBooksBookPage {
  id: string;
  bookId: string;
  layoutId: string | null;
  templateId: string | null;
  title: string;
  slug: string;
  pageNumber: number;
  sortOrder: number;
  content: Record<string, unknown>;
  backgroundImageId: string | null;
  isVisible: boolean;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TalisBooksPublishEvent {
  id: string;
  bookId: string;
  fromStatus: TalisBooksPublishStatus | null;
  toStatus: TalisBooksPublishStatus;
  note: string;
  changedBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface TalisBooksDashboardStats {
  totalBooks: number;
  publishedBooks: number;
  draftBooks: number;
  inReviewBooks: number;
  totalPages: number;
  totalTemplates: number;
  totalImages: number;
  totalAuthors: number;
}

export interface TalisBooksActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  status?: string;
  badge?: string;
}

export interface TalisBooksDashboardData {
  stats: TalisBooksDashboardStats;
  latestBooks: TalisBooksActivityItem[];
  recentPages: TalisBooksActivityItem[];
  recentPublishEvents: TalisBooksActivityItem[];
}
