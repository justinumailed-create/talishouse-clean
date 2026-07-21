export type TalisMapsMapStatus = "draft" | "published" | "archived";
export type TalisMapsAccountType = "root" | "derivative" | "adpro";
export type TalisMapsPinType = "standard" | "property" | "adpro" | "featured";
export type TalisMapsPermissionRole = "owner" | "editor" | "viewer";
export type TalisMapsAnalyticsEvent =
  | "view"
  | "pin_click"
  | "search"
  | "qr_scan"
  | "share"
  | "export";
export type TalisMapsInvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export interface TalisMapsMap {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: TalisMapsMapStatus;
  accountId: string | null;
  parentMapId: string | null;
  mapsiteId: string | null;
  fastCode: string | null;
  accountType: TalisMapsAccountType;
  defaultLatitude: number | null;
  defaultLongitude: number | null;
  defaultZoom: number;
  isPublic: boolean;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TalisMapsPinCategory {
  id: string;
  mapId: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  description: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TalisMapsMapPin {
  id: string;
  mapId: string;
  categoryId: string | null;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  website: string;
  phone: string;
  email: string;
  pinType: TalisMapsPinType;
  featured: boolean;
  sortOrder: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TalisMapsDashboardStats {
  totalMaps: number;
  totalPins: number;
  publishedMaps: number;
  draftMaps: number;
  visitors: number;
  qrScans: number;
  activeListings: number;
  rootAccounts: number;
  derivativeAccounts: number;
  adproPins: number;
}

export interface TalisMapsActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  status?: string;
  badge?: string;
}

export interface TalisMapsVisitorTrendPoint {
  date: string;
  label: string;
  count: number;
}

export interface TalisMapsDashboardData {
  stats: TalisMapsDashboardStats;
  latestMaps: TalisMapsActivityItem[];
  recentPinUpdates: TalisMapsActivityItem[];
  recentImports: TalisMapsActivityItem[];
  visitorTrend: TalisMapsVisitorTrendPoint[];
}
