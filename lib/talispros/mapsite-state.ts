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
