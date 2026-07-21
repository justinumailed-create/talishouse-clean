export type TalisMapsPinKind = "root" | "derivative" | "adpro" | "property";

export type TalisMapsPinVisibility = "public" | "private" | "network";

export type TalisMapsPinStatus = "draft" | "published" | "archived";

export interface TalisMapsPinMediaRecord {
  id: string;
  pinId: string;
  mediaType: "image" | "video" | "document";
  url: string;
  altText: string;
  caption: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface TalisMapsPinRecord {
  id: string;
  mapId: string;
  name: string;
  description: string;
  pinType: TalisMapsPinKind;
  latitude: number;
  longitude: number;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  categoryColor: string;
  ownerId: string | null;
  ownerName: string | null;
  visibility: TalisMapsPinVisibility;
  themeId: string | null;
  themeName: string | null;
  status: TalisMapsPinStatus;
  featured: boolean;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  website: string;
  phone: string;
  email: string;
  sortOrder: number;
  metadata: Record<string, unknown>;
  media: TalisMapsPinMediaRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface TalisMapsPinCategoryRecord {
  id: string;
  mapId: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  description: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface TalisMapsEditorBootstrap {
  map: {
    id: string;
    slug: string;
    name: string;
    status: string;
    defaultLatitude: number | null;
    defaultLongitude: number | null;
    defaultZoom: number;
  };
  categories: TalisMapsPinCategoryRecord[];
  pins: TalisMapsPinRecord[];
}

export interface CreateTalisMapsPinInput {
  pinType: TalisMapsPinKind;
  name?: string;
  latitude?: number;
  longitude?: number;
  categoryId?: string | null;
}

export interface UpdateTalisMapsPinInput {
  name?: string;
  description?: string;
  pinType?: TalisMapsPinKind;
  latitude?: number;
  longitude?: number;
  categoryId?: string | null;
  ownerId?: string | null;
  visibility?: TalisMapsPinVisibility;
  themeId?: string | null;
  status?: TalisMapsPinStatus;
  featured?: boolean;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  website?: string;
  phone?: string;
  email?: string;
  media?: Array<{
    id?: string;
    url: string;
    mediaType?: "image" | "video" | "document";
    altText?: string;
    caption?: string;
    isPrimary?: boolean;
    sortOrder?: number;
  }>;
}

export type PinSaveState = "idle" | "saving" | "saved" | "error";
