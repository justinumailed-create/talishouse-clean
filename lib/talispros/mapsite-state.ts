/**
 * MapSite™ platform lifecycle.
 *
 * UNCLAIMED → BUILD_REQUEST_SUBMITTED → MARKETING_REVIEW → ACTIVE → ARCHIVED
 */

export const MAPSITE_PLATFORM_STATUSES = [
  "UNCLAIMED",
  "BUILD_REQUEST_SUBMITTED",
  "MARKETING_REVIEW",
  "ACTIVE",
  "ARCHIVED",
] as const;

export type MapSitePlatformStatus = (typeof MAPSITE_PLATFORM_STATUSES)[number];

/** Database / storage representation (snake_case). */
export type MapSiteDbStatus =
  | "unclaimed"
  | "build_request_submitted"
  | "marketing_review"
  | "active"
  | "archived"
  | "draft";

const DB_TO_PLATFORM: Record<string, MapSitePlatformStatus> = {
  unclaimed: "UNCLAIMED",
  build_request_submitted: "BUILD_REQUEST_SUBMITTED",
  marketing_review: "MARKETING_REVIEW",
  active: "ACTIVE",
  archived: "ARCHIVED",
  // Legacy draft mapsites behave as marketing review until activated.
  draft: "MARKETING_REVIEW",
};

const PLATFORM_TO_DB: Record<MapSitePlatformStatus, MapSiteDbStatus> = {
  UNCLAIMED: "unclaimed",
  BUILD_REQUEST_SUBMITTED: "build_request_submitted",
  MARKETING_REVIEW: "marketing_review",
  ACTIVE: "active",
  ARCHIVED: "archived",
};

export function toPlatformStatus(
  value: string | null | undefined
): MapSitePlatformStatus {
  if (!value) return "UNCLAIMED";
  const key = value.trim().toLowerCase();
  return DB_TO_PLATFORM[key] ?? "UNCLAIMED";
}

export function toDbStatus(status: MapSitePlatformStatus): MapSiteDbStatus {
  return PLATFORM_TO_DB[status];
}

export function isClaimable(status: MapSitePlatformStatus): boolean {
  return status === "UNCLAIMED";
}

/** After claim (or once past unclaimed), popup shows MLS / URL / TEB / TTV. */
export function showsResourceActions(status: MapSitePlatformStatus): boolean {
  return (
    status === "BUILD_REQUEST_SUBMITTED" ||
    status === "MARKETING_REVIEW" ||
    status === "ACTIVE"
  );
}

export function pinPhaseLabel(status: MapSitePlatformStatus): string {
  switch (status) {
    case "UNCLAIMED":
      return "UNCLAIMED";
    case "BUILD_REQUEST_SUBMITTED":
    case "MARKETING_REVIEW":
      return "PENDING";
    case "ACTIVE":
      return "ACTIVE";
    case "ARCHIVED":
      return "ARCHIVED";
  }
}

const TRANSITIONS: Record<MapSitePlatformStatus, MapSitePlatformStatus[]> = {
  UNCLAIMED: ["BUILD_REQUEST_SUBMITTED", "ARCHIVED"],
  BUILD_REQUEST_SUBMITTED: ["MARKETING_REVIEW", "ARCHIVED"],
  MARKETING_REVIEW: ["ACTIVE", "BUILD_REQUEST_SUBMITTED", "ARCHIVED"],
  ACTIVE: ["ARCHIVED", "MARKETING_REVIEW"],
  ARCHIVED: ["UNCLAIMED", "MARKETING_REVIEW"],
};

export function canTransition(
  from: MapSitePlatformStatus,
  to: MapSitePlatformStatus
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(
  from: MapSitePlatformStatus,
  to: MapSitePlatformStatus
): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid MapSite™ transition: ${from} → ${to}`);
  }
}

export const DEMO_MAPSITE_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_MAPSITE_FAST_CODE = "DEMO";

export const MAPSITE_APP_PATH = "/talispros/mapsite";

/**
 * Claimed MapSite path segment for account / market type.
 * Accepts claim account types (root, derivative, adpro) and audiences (listings, …).
 */
export function mapsiteAccountTypeSegment(
  value: string | null | undefined
): string {
  const normalized = value?.trim().toLowerCase() || "";
  if (!normalized) return "listings";

  if (normalized === "root-1" || normalized === "root_1" || normalized === "test") {
    return "root";
  }
  if (normalized === "root") return "root";
  if (normalized === "derivative") return "derivative";
  if (normalized.startsWith("adpro")) return "adpro";

  if (
    normalized === "listings" ||
    normalized === "homes" ||
    normalized === "fsbos" ||
    normalized === "brokers" ||
    normalized === "adpro"
  ) {
    return normalized;
  }

  return "listings";
}

/** Short claimed MapSite URL: /talispros/mapsite/{accountType}/{fastCode} */
export function buildClaimedMapSitePath(options: {
  fastCode: string;
  accountType?: string | null;
  audience?: string | null;
}): string {
  const fastCode = options.fastCode.trim().toLowerCase();
  const accountType = mapsiteAccountTypeSegment(
    options.audience || options.accountType
  );
  return `${MAPSITE_APP_PATH}/${encodeURIComponent(accountType)}/${encodeURIComponent(fastCode)}`;
}

/**
 * Claim a Market™ registration invite (pre-claim / share for registration).
 * Recipient submits the form, then lands on the post-claim MapSite (PayPal).
 */
export function buildClaimRegistrationHref(options: {
  mapsiteId: string;
  audience?: string | null;
  accountType?: string | null;
}): string {
  const audience = mapsiteAccountTypeSegment(
    options.audience || options.accountType
  );
  const params = new URLSearchParams({
    mapsiteId: options.mapsiteId,
    audience,
    returnTo: MAPSITE_APP_PATH,
  });
  return `/talispros/markets/claim-a-market?${params.toString()}`;
}

/** Absolute share URL for admin copy/paste (falls back to path-only on server). */
export function toShareableAbsoluteUrl(
  path: string,
  origin?: string | null
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base =
    origin?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "";
  return base ? `${base}${normalizedPath}` : normalizedPath;
}
