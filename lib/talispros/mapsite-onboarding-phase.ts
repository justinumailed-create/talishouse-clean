import type { MapSitePlatformStatus } from "@/lib/talispros/mapsite-state";

/**
 * UI-only onboarding phases for MapSite™ popup / sidebar gating.
 * Does NOT change database `mapsites.status` values.
 */
export const MAPSITE_ONBOARDING_PHASES = [
  "UNCLAIMED",
  "BUILD_SUBMITTED",
  "BOOK_READY",
  "ACTIVE",
  "ARCHIVED",
] as const;

export type MapSiteOnboardingPhase = (typeof MAPSITE_ONBOARDING_PHASES)[number];

export type GetMapSiteOnboardingPhaseInput = {
  /** Existing platform status (from DB via toPlatformStatus). */
  status: MapSitePlatformStatus;
  /** Completed PayPal payment on file (existing payment helper). */
  paymentReceived: boolean;
  /** Whether a TalisBook™ already exists for this FAST Code / MapSite. */
  hasTalisBook: boolean;
};

/**
 * Derive popup / onboarding UI phase from existing status + payment + book.
 *
 * MLS® / URL / TEB™ / TTV™ only unlock after PayPal (`paymentReceived`).
 * Platform status ACTIVE alone is not enough — unpaid MapSites stay in the
 * pending popup (View Your TalisBook™ + Activate) until payment clears.
 */
export function getMapSiteOnboardingPhase(
  input: GetMapSiteOnboardingPhaseInput
): MapSiteOnboardingPhase {
  const { status, paymentReceived, hasTalisBook } = input;

  if (status === "ARCHIVED") return "ARCHIVED";
  if (status === "UNCLAIMED") return "UNCLAIMED";

  // Full resource UI only after completed payment.
  if (paymentReceived) return "ACTIVE";

  // Pending activation (including unpaid platform-ACTIVE).
  if (hasTalisBook) return "BOOK_READY";
  return "BUILD_SUBMITTED";
}

/** Pending MapSites before payment — hide resource buttons / Express Interest. */
export function isPendingActivationPhase(
  phase: MapSiteOnboardingPhase
): boolean {
  return phase === "BUILD_SUBMITTED" || phase === "BOOK_READY";
}

/** Show MLS® / URL / TEB™ / TTV™ — only after payment (ACTIVE phase). */
export function showsActiveResourceButtons(
  phase: MapSiteOnboardingPhase
): boolean {
  return phase === "ACTIVE";
}
