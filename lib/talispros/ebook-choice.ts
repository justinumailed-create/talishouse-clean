import {
  buildClaimedMapSitePath,
  MAPSITE_APP_PATH,
} from "@/lib/talispros/mapsite-state";

/** Landing after SimpleTexting YES — E-Book decision only (not registration). */
export const EBOOK_CHOICE_PATH = "/talispros/ebook-choice";

export type EbookChoiceOption = "self" | "rahul";

export type PostBuildSuccessPath = "self-ebook" | "rahul-waiting" | "mapsite";

/** Query flag: pending MapSite waiting for Rahul’s first TalisBook™. */
export const BOOK_PENDING_QUERY = "bookPending";

/** Query flag: show existing PayPal activation card on the MapSite. */
export const ACTIVATE_QUERY = "activate";

export function buildEbookChoiceHref(options: {
  fastCode?: string | null;
  mapsiteId?: string | null;
  accountType?: string | null;
  requestId?: string | null;
  /** SimpleTexting YES handoff. */
  yes?: boolean;
}): string {
  const params = new URLSearchParams();
  if (options.fastCode?.trim()) {
    params.set("fastCode", options.fastCode.trim());
  }
  if (options.mapsiteId?.trim()) {
    params.set("mapsiteId", options.mapsiteId.trim());
  }
  if (options.accountType?.trim()) {
    params.set("accountType", options.accountType.trim());
  }
  if (options.requestId?.trim()) {
    params.set("requestId", options.requestId.trim());
  }
  if (options.yes) params.set("yes", "1");
  const query = params.toString();
  return query ? `${EBOOK_CHOICE_PATH}?${query}` : EBOOK_CHOICE_PATH;
}

/** Continue after “Generate My Own E-Book”.
 * Canonical handoff: requestId only. Server resolves FAST Code / MapSite from DB.
 * Legacy fastCode/mapsiteId/accountType query params are ignored by the page
 * when requestId is present (kept optional only for older bookmarks).
 */
export function buildSelfEbookContinueHref(options: {
  fastCode?: string | null;
  mapsiteId?: string | null;
  accountType?: string | null;
  requestId?: string | null;
}): string {
  const requestId = options.requestId?.trim();
  if (requestId) {
    const params = new URLSearchParams({ requestId });
    return `/talispros/ebook-generate?${params.toString()}`;
  }

  // Legacy fallback when callers have not yet adopted requestId-only handoff.
  const params = new URLSearchParams();
  if (options.fastCode?.trim()) {
    params.set("fastCode", options.fastCode.trim());
  }
  if (options.mapsiteId?.trim()) {
    params.set("mapsiteId", options.mapsiteId.trim());
  }
  if (options.accountType?.trim()) {
    params.set("accountType", options.accountType.trim());
  }
  const query = params.toString();
  return query
    ? `/talispros/ebook-generate?${query}`
    : "/talispros/ebook-generate";
}

/** Continue after “Have Rahul Build It For Me” (admin/internal upload only). */
export function buildRahulEbookContinueHref(options: {
  fastCode?: string | null;
  mapsiteId?: string | null;
  accountType?: string | null;
  requestId?: string | null;
}): string {
  const params = new URLSearchParams();
  if (options.fastCode?.trim()) {
    params.set("fastCode", options.fastCode.trim());
  }
  if (options.mapsiteId?.trim()) {
    params.set("mapsiteId", options.mapsiteId.trim());
  }
  if (options.accountType?.trim()) {
    params.set("accountType", options.accountType.trim());
  }
  if (options.requestId?.trim()) {
    params.set("requestId", options.requestId.trim());
  }
  const query = params.toString();
  return query ? `/talispros/ebook-rahul?${query}` : "/talispros/ebook-rahul";
}

function appendCommonMapSiteParams(
  params: URLSearchParams,
  options: {
    mapsiteId?: string | null;
    requestId?: string | null;
    bookSlug?: string | null;
  }
) {
  if (options.requestId?.trim()) {
    params.set("requestId", options.requestId.trim());
  }
  if (options.mapsiteId?.trim()) {
    params.set("mapsiteId", options.mapsiteId.trim());
  }
  if (options.bookSlug?.trim()) {
    params.set("book", options.bookSlug.trim());
  }
}

/** Rahul path: open pending MapSite while Marketing Admin prepares the book. */
export function buildRahulWaitingMapSiteHref(options: {
  fastCode?: string | null;
  mapsiteId?: string | null;
  accountType?: string | null;
  requestId?: string | null;
}): string {
  const fastCode = options.fastCode?.trim() || "";
  const params = new URLSearchParams({
    view: "pin",
    [BOOK_PENDING_QUERY]: "1",
  });
  appendCommonMapSiteParams(params, options);

  if (fastCode && fastCode.toLowerCase() !== "demo") {
    return `${buildClaimedMapSitePath({
      fastCode,
      accountType: options.accountType,
    })}?${params.toString()}`;
  }

  params.set("claimed", "1");
  if (fastCode) params.set("fastCode", fastCode);
  if (options.accountType?.trim()) {
    params.set("audience", options.accountType.trim());
  }
  return `${MAPSITE_APP_PATH}?${params.toString()}`;
}

/** After self-service TalisBook™ create — open claimed MapSite with popup. */
export function buildMapSiteAfterBookHref(options: {
  fastCode?: string | null;
  mapsiteId?: string | null;
  accountType?: string | null;
  requestId?: string | null;
  bookSlug?: string | null;
}): string {
  const fastCode = options.fastCode?.trim() || "";
  const params = new URLSearchParams({ view: "pin" });
  appendCommonMapSiteParams(params, options);

  if (fastCode && fastCode.toLowerCase() !== "demo") {
    return `${buildClaimedMapSitePath({
      fastCode,
      accountType: options.accountType,
    })}?${params.toString()}`;
  }

  params.set("claimed", "1");
  if (fastCode) params.set("fastCode", fastCode);
  if (options.accountType?.trim()) {
    params.set("audience", options.accountType.trim());
  }
  return `${MAPSITE_APP_PATH}?${params.toString()}`;
}

/** Activate Your MapSite™ — same MapSite with existing PayPal card visible. */
export function buildActivateMapSiteHref(options: {
  fastCode?: string | null;
  mapsiteId?: string | null;
  accountType?: string | null;
  requestId?: string | null;
}): string {
  const fastCode = options.fastCode?.trim() || "";
  const params = new URLSearchParams({
    view: "pin",
    [ACTIVATE_QUERY]: "1",
  });
  appendCommonMapSiteParams(params, options);

  if (fastCode && fastCode.toLowerCase() !== "demo") {
    return `${buildClaimedMapSitePath({
      fastCode,
      accountType: options.accountType,
    })}?${params.toString()}`;
  }

  params.set("claimed", "1");
  if (fastCode) params.set("fastCode", fastCode);
  if (options.accountType?.trim()) {
    params.set("audience", options.accountType.trim());
  }
  return `${MAPSITE_APP_PATH}?${params.toString()}`;
}
