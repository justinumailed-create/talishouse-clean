import { buildClaimedMapSitePath } from "@/lib/talispros/mapsite-state";

/** Owner Ebook Editor page for one ebook (separate page, Back → Mapsite). */
export function ownerEbookEditorPath(fastCode: string, bookId: string, back?: string | null): string {
  const base = `/talispros/mapsites/${encodeURIComponent(fastCode.trim().toLowerCase())}/ebooks/${encodeURIComponent(bookId)}`;
  return back ? `${base}?back=${encodeURIComponent(back)}` : base;
}

/** Owner "Create new ebook" page (Build Talisbook™ / upload flow). */
export function ownerEbookCreatePath(fastCode: string, back?: string | null): string {
  const base = `/talispros/mapsites/${encodeURIComponent(fastCode.trim().toLowerCase())}/ebooks/new`;
  return back ? `${base}?back=${encodeURIComponent(back)}` : base;
}

/** Only same-site Mapsite paths are accepted as Back targets (no open redirects). */
export function safeMapSiteBackHref(
  back: string | null | undefined,
  fallback: { fastCode: string; accountType?: string | null },
): string {
  const value = back?.trim() || "";
  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    (value.startsWith("/talispros/mapsite") || value.startsWith("/mapsite/"))
  ) {
    return value;
  }
  return buildClaimedMapSitePath(fallback);
}
