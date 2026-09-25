/**
 * Shared book-title helpers for Talisbooks™ shelves and create flows.
 *
 * Historically, empty titles were filled with a synthetic
 * `${FASTCODE} Talisbook™` fallback. That string is no longer desired on
 * shelves — prefer a real title, or cover-only when none exists.
 */

/** e.g. "ALLPINS Talisbook™", "RM22 Talisbook", optional parentheses. */
const SYNTHETIC_FAST_CODE_TALISBOOK_TITLE =
  /^\(?[A-Za-z0-9_-]+\)?\s+Talisbook(?:™)?$/i;

export function isSyntheticFastCodeTalisbookTitle(
  title: string | null | undefined,
): boolean {
  return SYNTHETIC_FAST_CODE_TALISBOOK_TITLE.test((title || "").trim());
}

/**
 * Title shown on shelf cards / chrome. Hides the auto-generated
 * `(CODE) Talisbook` pattern so existing books fix without re-create.
 */
export function displayShelfBookTitle(
  title: string | null | undefined,
): string {
  const trimmed = (title || "").trim();
  if (!trimmed || isSyntheticFastCodeTalisbookTitle(trimmed)) return "";
  return trimmed;
}

/** Persistable title input — never invent the synthetic FAST-code fallback. */
export function resolvePersistedBookTitle(
  title: string | null | undefined,
): string {
  return (title || "").trim();
}
