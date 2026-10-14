"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/i18n/client";

/**
 * PMC rule: links open inside an iframe modal on click (with an
 * "open in new tab" escape hatch — many portals forbid framing).
 */
export function IframeModal({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  const t = useT().pmc.media;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-testid="pmc-iframe-modal"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#06182f]/75 p-2 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex h-full max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-black/10 bg-neutral-50 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-neutral-900">{title}</p>
            <p className="truncate text-[12px] text-neutral-500">{url}</p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-black/15 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#0069CF] hover:border-[#0069CF]"
          >
            {t.newTab} ↗
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#06182f] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-black"
          >
            {t.close} ✕
          </button>
        </div>
        <p className="border-b border-black/5 bg-amber-50 px-4 py-1.5 text-[11px] text-amber-800">{t.modalNote}</p>
        <iframe
          src={url}
          title={title}
          className="min-h-0 w-full flex-1 bg-white"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>,
    document.body,
  );
}

export default function IframeLink({
  url,
  title,
  className,
  children,
  testId,
}: {
  url: string;
  title: string;
  className?: string;
  children: ReactNode;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <a
        href={url}
        data-testid={testId}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey) return;
          e.preventDefault();
          setOpen(true);
        }}
        className={className}
      >
        {children}
      </a>
      {open ? <IframeModal url={url} title={title} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
