"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ADVISER_METAL_BG } from "@/components/talisu/AdviserLayout";
import {
  METAL_TAB,
  METAL_TAB_LABEL,
  METAL_TAB_SHEEN,
  METAL_TAB_UNSELECTED,
} from "@/components/talisu/metal-tab";
import {
  TSPLITS_PLAYBOOK_PDF_API,
  TSPLITS_PLAYBOOK_PDF_FILE_NAME,
  TSPLITS_PLAYBOOK_VIEW_API,
  type TsplitsPlaybookCopy,
} from "@/lib/talisu/tsplits-playbook";

/** Unlocked view: title bar with Download PDF, then the playbook HTML. */
export default function TsplitsPlaybookViewer({ copy }: { copy: TsplitsPlaybookCopy }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1200);

  const fit = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!doc?.documentElement) return;
    setHeight(Math.max(600, doc.documentElement.scrollHeight));
  }, []);

  useEffect(() => {
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [fit]);

  return (
    <div data-testid="tsplits-playbook" className="bg-[#e9edf3] pb-16 text-[#1d1d1f] antialiased">
      <div style={{ maxWidth: 920 }} className="mx-auto flex w-full flex-wrap items-center justify-between gap-4 px-4 pb-4 pt-6 sm:px-0">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-[#12355B] sm:text-[26px]">
          {copy.title}
        </h1>
        <a
          href={TSPLITS_PLAYBOOK_PDF_API}
          download={TSPLITS_PLAYBOOK_PDF_FILE_NAME}
          data-testid="tsplits-playbook-download-pdf"
          className={`${METAL_TAB} ${METAL_TAB_UNSELECTED} cursor-pointer no-underline`}
          style={{ backgroundImage: ADVISER_METAL_BG, width: 200 }}
        >
          <span className={METAL_TAB_SHEEN} aria-hidden />
          <span className={`${METAL_TAB_LABEL} whitespace-nowrap`}>{copy.downloadPdf}</span>
        </a>
      </div>
      <iframe
        ref={frame}
        src={TSPLITS_PLAYBOOK_VIEW_API}
        title={copy.frameTitle}
        onLoad={fit}
        scrolling="no"
        data-testid="tsplits-playbook-frame"
        className="mx-auto block w-full max-w-[920px] border-0 bg-white"
        style={{ height, maxWidth: 920 }}
      />
    </div>
  );
}
