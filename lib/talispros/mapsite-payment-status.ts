const COMPLETED_PAYMENT_STATUSES = new Set([
  "completed",
  "paid",
  "complete",
  "succeeded",
]);

export function isCompletedTalisprosPaymentStatus(
  status: string | null | undefined,
): boolean {
  return COMPLETED_PAYMENT_STATUSES.has(status?.trim().toLowerCase() || "");
}

export function normalizePaymentEmail(
  email: string | null | undefined,
): string | null {
  const value = email?.trim().toLowerCase() || "";
  return value && value.includes("@") ? value : null;
}
