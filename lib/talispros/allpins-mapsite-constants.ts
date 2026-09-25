/** Client-safe ALLPINS constants (no server / Supabase imports). */

export const ALLPINS_FAST_CODE = "allpins";

export function isAllPinsFastCode(
  value: string | null | undefined,
): boolean {
  return (value || "").trim().toLowerCase() === ALLPINS_FAST_CODE;
}
