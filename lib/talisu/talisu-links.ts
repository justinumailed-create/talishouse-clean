/**
 * TalisU link targets (Ralf, Oct 17 2026): everything in TalisBOT points at
 * TalisU so future additions show up on Talispros without per-page edits.
 *
 * talisu.com currently serves Ralf's separate TalisU welcome site and has
 * none of the /talisu/* pages, so links stay on this app's /talisu/* paths
 * until NEXT_PUBLIC_TALISU_ORIGIN is set (e.g. "https://talisu.com"). Then
 * every TalisU link switches at once.
 */
export const TALISU_ORIGIN = (process.env.NEXT_PUBLIC_TALISU_ORIGIN || "")
  .trim()
  .replace(/\/+$/, "");

/** A TalisU path ("/talisu/…") on the TalisU origin when one is configured. */
export function talisuHref(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${TALISU_ORIGIN}${p}`;
}

/** "Discuss a Project without first registering" page. */
export const TALISU_DISCUSS_PATH = "/talisu/discuss";

/** Discuss page for one transaction structure (Learn More links). */
export function talisuDiscussHref(topicId?: string | null): string {
  const id = (topicId || "").trim().toLowerCase();
  return talisuHref(id ? `${TALISU_DISCUSS_PATH}?topic=${encodeURIComponent(id)}` : TALISU_DISCUSS_PATH);
}
