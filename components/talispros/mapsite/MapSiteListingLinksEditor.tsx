"use client";

import { useEffect, useState, useTransition } from "react";
import { saveMapSiteListingLinksAction } from "@/app/talispros/mapsite/dashboard-actions";
import { useT } from "@/lib/i18n/client";
import {
  clearFormDraft,
  draftString,
  formDraftKey,
  readFormDraft,
  writeFormDraft,
} from "@/lib/talispros/form-drafts";
import { isMapSiteDashboardSectionVisible } from "@/lib/talispros/mapsite-dashboard-tabs";
import { DashboardNotice } from "./MapSiteDashboardPanel";

/** localStorage scope for an unsaved listing URL, keyed per Mapsite. */
export const MAPSITE_LINKS_DRAFT_SCOPE = "mapsite-links";

type MapSiteListingLinksEditorProps = {
  mapsiteId: string;
  fastCode: string;
  initialListingUrl: string | null;
  onOpenSection: (section: "ebooks" | "bookshelf") => void;
  onSaved?: (listingUrl: string | null) => void;
};

/** URL 1 (listing / brokerage) plus jumps to the TEB and Bookshelf editors. */
export default function MapSiteListingLinksEditor({
  mapsiteId,
  fastCode,
  initialListingUrl,
  onOpenSection,
  onSaved,
}: MapSiteListingLinksEditorProps) {
  const copy = useT().mapsite.dashboardPage;
  const draftKey = formDraftKey(MAPSITE_LINKS_DRAFT_SCOPE, mapsiteId || fastCode);
  const savedUrl = initialListingUrl ?? "";
  // Resume an unsaved URL typed in this or another tab.
  const [listingUrl, setListingUrl] = useState(() => {
    const draft = readFormDraft<{ listingUrl: string }>(draftKey);
    return draft ? draftString(draft.listingUrl, savedUrl) : savedUrl;
  });
  const showEbook = isMapSiteDashboardSectionVisible("ebooks");
  const showBookshelf = isMapSiteDashboardSectionVisible("bookshelf");

  useEffect(() => {
    if (listingUrl === savedUrl) clearFormDraft(draftKey);
    else writeFormDraft(draftKey, { listingUrl });
  }, [draftKey, listingUrl, savedUrl]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveMapSiteListingLinksAction({
        mapsiteId,
        fastCode,
        listingUrl,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      clearFormDraft(draftKey);
      setListingUrl(result.listingUrl ?? "");
      onSaved?.(result.listingUrl);
      setMessage(copy.linksSaved);
    });
  }

  return (
    <div className="space-y-4 text-sm" data-testid="mapsite-listing-links-editor">
      <p className="text-[13px] leading-relaxed text-neutral-600">{copy.linksIntro}</p>
      {message ? <DashboardNotice tone="success">{message}</DashboardNotice> : null}
      {error ? <DashboardNotice tone="error">{error}</DashboardNotice> : null}
      <label className="block text-xs font-medium text-neutral-700">
        {copy.listingUrl}
        <input
          type="url"
          value={listingUrl}
          onChange={(event) => setListingUrl(event.target.value)}
          placeholder="https://"
          autoComplete="off"
          data-testid="mapsite-listing-url"
          className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-[14px] text-neutral-950"
        />
        <span className="mt-1 block text-[12px] font-normal text-neutral-500">
          {copy.listingUrlHint}
        </span>
      </label>
      <button
        type="button"
        onClick={save}
        disabled={pending}
        data-testid="mapsite-listing-url-save"
        className="inline-flex min-h-11 items-center rounded-full bg-[#046BD9] px-6 text-[15px] font-semibold text-white shadow-[0_6px_14px_rgba(4,107,217,0.3)] hover:bg-[#0358b3] disabled:opacity-60"
      >
        {pending ? copy.saving : copy.saveLinks}
      </button>
      {showEbook || showBookshelf ? (
      <div className="flex flex-wrap gap-2 border-t border-neutral-200 pt-4">
        {showEbook ? (
        <button
          type="button"
          onClick={() => onOpenSection("ebooks")}
          className="inline-flex min-h-10 items-center rounded-full border border-neutral-300 bg-white px-4 text-[14px] font-medium text-neutral-800 hover:bg-neutral-50"
        >
          {copy.openEbook}
        </button>
        ) : null}
        {showBookshelf ? (
        <button
          type="button"
          onClick={() => onOpenSection("bookshelf")}
          className="inline-flex min-h-10 items-center rounded-full border border-neutral-300 bg-white px-4 text-[14px] font-medium text-neutral-800 hover:bg-neutral-50"
        >
          {copy.openBookshelf}
        </button>
        ) : null}
      </div>
      ) : null}
    </div>
  );
}
