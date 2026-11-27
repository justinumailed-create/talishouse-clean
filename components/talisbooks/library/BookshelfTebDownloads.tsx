"use client";

import { useState } from "react";
import EbookPlatformLinks from "@/components/talisbooks/viewer/EbookPlatformLinks";
import MapSiteGreyFlagAction from "@/components/talispros/mapsite/MapSiteGreyFlagAction";
import { useT } from "@/lib/i18n/client";

/**
 * TEB flow on the FAST Code bookshelf (Ralf, Nov 27, 8:52 PM IST): the
 * PowerPoint, Keynote and Google Slides files sit here for download, next to
 * the owner's attached TEB PDF. Registered owners only (same gate as the
 * eBook viewer header); visitors never see this block.
 */
export default function BookshelfTebDownloads({
  fastCode,
  tebPdfUrl = null,
  canAttach = false,
}: {
  fastCode: string;
  tebPdfUrl?: string | null;
  canAttach?: boolean;
}) {
  const t = useT();
  const copy = t.mapsite.bookshelfDownloads;
  const flag = t.mapsite.flagActions;
  const [pdfUrl, setPdfUrl] = useState(tebPdfUrl);
  const [attaching, setAttaching] = useState(false);
  return (
    <div className="flex flex-col items-end gap-1.5" data-testid="bookshelf-teb-downloads">
      <p className="m-0 text-[13px] font-bold uppercase tracking-wider text-neutral-600">{copy.title}</p>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {pdfUrl ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            download
            data-testid="bookshelf-teb-pdf"
            className="talisbooks-viewer__back min-h-11 text-[15px] font-semibold"
          >
            {copy.tebPdf}
          </a>
        ) : null}
        <EbookPlatformLinks unlocked fastCode={fastCode} />
      </div>
      {canAttach ? (
        attaching ? (
          <div className="w-full max-w-sm">
            <MapSiteGreyFlagAction
              action="teb"
              mapsiteId=""
              fastCode={fastCode}
              onClose={() => setAttaching(false)}
              onUrlSaved={() => undefined}
              onAttached={(_kind, url) => setPdfUrl(url)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAttaching(true)}
            data-testid="bookshelf-teb-attach"
            className="text-[14px] font-semibold text-neutral-900 underline"
          >
            {flag.tebTitle}
          </button>
        )
      ) : null}
    </div>
  );
}
