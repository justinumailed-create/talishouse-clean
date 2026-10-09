"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";
import {
  DEMO_MAPSITE_PDF_FILE_NAME,
  DEMO_MAPSITE_PDF_HREF,
  DEMO_TEMPLATE_GOOGLE_SLIDES_COPY_HREF,
  DEMO_TEMPLATE_KEYNOTE_FILE_NAME,
  DEMO_TEMPLATE_KEYNOTE_HREF,
  DEMO_TEMPLATE_PPTX_FILE_NAME,
  DEMO_TEMPLATE_PPTX_HREF,
} from "@/lib/talispros/demo-mapsite";

/**
 * "Download Demo PDF" control: the Centrefolds Demo PDF plus ready-made
 * "Replace Image" templates (PowerPoint, Keynote, Google Slides copy link).
 */
export default function DemoDownloadMenu({ className = "" }: { className?: string }) {
  const d = useT().demo;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const itemClass =
    "flex min-h-10 items-center justify-between gap-3 rounded-xl px-3 text-[14px] text-neutral-900 transition hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none";
  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className={className || "relative"} data-testid="demo-download-menu">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-neutral-950 px-4 text-[13px] font-medium text-white transition hover:bg-neutral-800 sm:text-[14px]"
      >
        {d.downloadPdf}
        <span
          aria-hidden="true"
          className="text-[10px] leading-none"
        >
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          style={{ width: "min(320px, calc(100vw - 32px))", maxWidth: "none" }}
          className="absolute right-0 mt-2 rounded-2xl bg-white p-2 text-left shadow-[0_1px_2px_rgba(0,0,0,0.06),0_16px_48px_rgba(0,0,0,0.14)] ring-1 ring-black/5"
        >
          <a
            role="menuitem"
            href={DEMO_MAPSITE_PDF_HREF}
            download={DEMO_MAPSITE_PDF_FILE_NAME}
            onClick={close}
            className={itemClass}
          >
            {d.downloadMenuPdf}
            <span className="text-[12px] text-neutral-400">PDF</span>
          </a>
          <p className="mt-2 border-t border-neutral-100 px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
            {d.downloadMenuTemplates}
          </p>
          <a
            role="menuitem"
            href={DEMO_TEMPLATE_PPTX_HREF}
            download={DEMO_TEMPLATE_PPTX_FILE_NAME}
            onClick={close}
            className={itemClass}
          >
            {d.downloadMenuPptx}
          </a>
          <a
            role="menuitem"
            href={DEMO_TEMPLATE_KEYNOTE_HREF}
            download={DEMO_TEMPLATE_KEYNOTE_FILE_NAME}
            onClick={close}
            className={itemClass}
          >
            {d.downloadMenuKeynote}
          </a>
          <a
            role="menuitem"
            href={DEMO_TEMPLATE_GOOGLE_SLIDES_COPY_HREF}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            className={itemClass}
          >
            {d.downloadMenuGoogleSlides}
            <span aria-hidden="true" className="text-[12px] text-neutral-400">↗</span>
          </a>
          <p className="px-3 pb-1 pt-2 text-[12px] leading-snug text-neutral-500">
            {d.downloadMenuHint}
          </p>
        </div>
      ) : null}
    </div>
  );
}
