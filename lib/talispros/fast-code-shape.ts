/** Client-safe FAST Code shape helpers (no server imports). */

/** Issued FAST Codes are initials + 2-digit sequence (e.g. ar01, jmd03), plus the seeded LRG1 listing. */
export function isIssuedFastCode(value: string | null | undefined): value is string {
  const code = value?.trim().toLowerCase() || "";
  if (code === "lrg1") return true;
  // Platform showcase aggregate map (multi-pin). Letters+digits only.
  if (code === "allpins") return true;
  return /^[a-z]{2,3}\d{2}$/.test(code);
}

/**
 * Path segment that is safe to rewrite to /home/{code}: issued FAST Codes
 * (two or three letters plus two digits, plus the seeded LRG1 listing).
 * Reserved app routes such as /app, /map and /home do not match this shape.
 */
export function isShortHomeFastCode(
  value: string | null | undefined,
): value is string {
  const code = value?.trim().toLowerCase() || "";
  if (code === "lrg1") return true;
  return /^[a-z]{2,3}\d{2}$/.test(code);
}
