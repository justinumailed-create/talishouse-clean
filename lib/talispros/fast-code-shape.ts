/** Client-safe FAST Code shape helpers (no server imports). */

/** Issued FAST Codes are initials + 2-digit sequence (e.g. ar01, jmd03). */
export function isIssuedFastCode(value: string | null | undefined): value is string {
  const code = value?.trim().toLowerCase() || "";
  return /^[a-z]{2,3}\d{2}$/.test(code);
}
