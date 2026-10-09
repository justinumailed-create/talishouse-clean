import { toPlatformStatus } from "@/lib/talispros/mapsite-state";

export type AdminMapSiteDeleteControl = "delete" | "lock" | "none";

/** Raw DB status `draft` (legacy, e.g. LRG1) — maps to MARKETING_REVIEW on the platform. */
export function isDraftMapSiteStatus(status: string | null | undefined): boolean {
  return (status || "").trim().toLowerCase() === "draft";
}

/**
 * Admin Mapsites list delete control.
 * - ACTIVE or legacy DRAFT, unpaid → Delete (with confirm in the UI)
 * - ACTIVE or DRAFT with a completed payment → locked
 * - everything else → no control
 */
export function adminMapSiteDeleteControl(input: {
  status: string;
  paymentReceived: boolean;
}): AdminMapSiteDeleteControl {
  const deletable =
    toPlatformStatus(input.status) === "ACTIVE" ||
    isDraftMapSiteStatus(input.status);
  if (!deletable) return "none";
  if (input.paymentReceived) return "lock";
  return "delete";
}
