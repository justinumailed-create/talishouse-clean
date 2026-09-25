/** Client-safe FAST Code shape helpers (no server imports). */

/** Issued FAST Codes are initials + 2-digit sequence (e.g. ar01, jmd03), plus the seeded LRG1 listing. */
export function isIssuedFastCode(value: string | null | undefined): value is string {
  const code = value?.trim().toLowerCase() || "";
  if (code === "lrg1") return true;
  // Platform showcase aggregate map (multi-pin). Letters+digits only.
  if (code === "allpins") return true;
  return /^[a-z]{2,3}\d{2}$/.test(code);
}
