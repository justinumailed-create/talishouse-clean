import { toPlatformStatus } from "@/lib/talispros/mapsite-state";

export type AdminMapSiteDeleteControl = "delete" | "lock" | "none";

export function adminMapSiteDeleteControl(input: {
  status: string;
  paymentReceived: boolean;
}): AdminMapSiteDeleteControl {
  if (toPlatformStatus(input.status) !== "ACTIVE") return "none";
  if (input.paymentReceived) return "lock";
  return "delete";
}
