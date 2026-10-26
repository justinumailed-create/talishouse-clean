"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/format";
import { talisUEngageCheckoutHref } from "@/lib/talisu/ask-step";
// Type-only: engage-designs.ts reads the page list from disk (server only).
import type { EngageDesign } from "@/lib/talisu/engage-designs";

/** Catalogue page rasters are 1920×1080. */
const ENGAGE_DESIGN_PAGE_ASPECT = { width: 1920, height: 1080 } as const;

const SWIPE_PX = 45;

/** One design cropped out of its catalogue page image (no extra assets). */
function DesignCrop({
  design,
  alt,
  eager = false,
}: {
  design: EngageDesign;
  alt: string;
  eager?: boolean;
}) {
  const { x, y, w, h } = design.rect;
  return (
    <div
      className="relative w-full overflow-hidden bg-neutral-100"
      style={{
        aspectRatio: `${w * ENGAGE_DESIGN_PAGE_ASPECT.width} / ${h * ENGAGE_DESIGN_PAGE_ASPECT.height}`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={design.src}
        alt={alt}
        draggable={false}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className="pointer-events-none absolute select-none"
        style={{
          // Inline: the global unlayered `img { max-width: 100% }` beats a utility.
          maxWidth: "none",
          width: `${10000 / w}%`,
          height: `${10000 / h}%`,
          left: `${(-x / w) * 100}%`,
          top: `${(-y / h) * 100}%`,
        }}
      />
    </div>
  );
}

/**
 * /talisu/engage design gallery (replaces the embedded flipbook): every
 * catalogue design as a thumbnail; tapping one opens a lightbox with
 * ←/→ (wrap-around), X, Esc, swipe, and Reserve → the $2,000 CAD down
 * payment tagged with the design's code (?step=pay&product=Pxx).
 */
export default function EngageDesignGallery({ designs }: { designs: EngageDesign[] }) {
  const e = useT().talisu.engage;
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const count = designs.length;

  const nameOf = (d: EngageDesign) => d.name ?? e.galleryDefaultName;

  const close = useCallback(() => {
    setOpen(null);
    lastTrigger.current?.focus();
  }, []);
  const step = useCallback(
    (delta: number) => {
      setOpen((i) => (i === null ? i : (i + delta + count) % count));
    },
    [count],
  );

  useEffect(() => {
    if (open === null) return;
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
    // Re-bind only when opening/closing, not on every step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open === null, close, step]);

  const current = open === null ? null : designs[open];

  return (
    <>
      <ul
        className="grid max-h-[30rem] grid-cols-3 gap-2 overflow-y-auto overscroll-contain rounded-xl border border-black/5 bg-white/60 p-2 sm:max-h-[34rem] sm:gap-2.5 xl:grid-cols-4"
        data-testid="engage-design-grid"
      >
        {designs.map((design, i) => (
          <li key={design.code}>
            <button
              type="button"
              onClick={(event) => {
                lastTrigger.current = event.currentTarget;
                setOpen(i);
              }}
              aria-label={fmt(e.galleryOpen, { code: design.code, name: nameOf(design) })}
              data-testid="engage-design"
              data-product-code={design.code}
              className="group block w-full cursor-pointer overflow-hidden rounded-lg bg-white text-left shadow-sm ring-1 ring-black/10 transition hover:ring-2 hover:ring-[#046BD9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#046BD9]"
            >
              <DesignCrop design={design} alt="" />
              <span className="block px-1.5 py-1 leading-tight">
                <span className="block text-[11px] font-semibold text-[#046BD9] sm:text-[12px]">
                  {design.code}
                </span>
                <span className="block truncate text-[10px] text-neutral-600 sm:text-[11px]">
                  {nameOf(design)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {current && open !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={fmt(e.galleryDialog, { code: current.code })}
          data-testid="engage-lightbox"
          data-product-code={current.code}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 px-3 backdrop-blur-sm py-14 sm:px-16"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
          onTouchStart={(event) => {
            const t = event.touches[0];
            touch.current = t ? { x: t.clientX, y: t.clientY } : null;
          }}
          onTouchEnd={(event) => {
            const start = touch.current;
            touch.current = null;
            const t = event.changedTouches[0];
            if (!start || !t) return;
            const dx = t.clientX - start.x;
            const dy = t.clientY - start.y;
            if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
          }}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label={e.galleryClose}
            data-testid="engage-lightbox-close"
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <figure className="w-full max-w-[1100px]">
            <div className="overflow-hidden rounded-lg shadow-2xl">
              <DesignCrop
                key={current.code}
                design={current}
                alt={`${current.code} — ${nameOf(current)}`}
                eager
              />
            </div>
            <figcaption className="mt-3 flex flex-col items-center gap-3 text-center text-white sm:flex-row sm:justify-between sm:text-left">
              <div>
                <div className="text-[16px] font-semibold sm:text-[18px]" data-testid="engage-lightbox-code">
                  {current.code}
                  <span className="font-normal text-white/80"> · {nameOf(current)}</span>
                </div>
                <div className="text-[12.5px] text-white/70" data-testid="engage-lightbox-count">
                  {fmt(e.galleryCount, { index: open + 1, count })}
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 sm:items-end">
                <Link
                  href={talisUEngageCheckoutHref(current.code)}
                  data-testid="engage-lightbox-reserve"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#046BD9] px-5 py-2 text-[15px] font-semibold text-white shadow-[0_6px_14px_rgba(4,107,217,0.4)] transition hover:bg-[#0358b3]"
                >
                  {fmt(e.galleryReserve, { code: current.code })}
                  <span aria-hidden>→</span>
                </Link>
                <span className="text-[11.5px] text-white/70">{e.galleryReserveNote}</span>
              </div>
            </figcaption>
          </figure>

          {count > 1 ? (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={e.galleryPrev}
                data-testid="engage-lightbox-prev"
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-4 sm:h-12 sm:w-12"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={e.galleryNext}
                data-testid="engage-lightbox-next"
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-4 sm:h-12 sm:w-12"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
