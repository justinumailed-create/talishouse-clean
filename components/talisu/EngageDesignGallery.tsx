"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";
// Type-only: engage-designs.ts reads the page list from disk (server only).
import type { EngageDesign } from "@/lib/talisu/engage-designs";

/** Catalogue page rasters are 1920×1080. */
const ENGAGE_DESIGN_PAGE_ASPECT = { width: 1920, height: 1080 } as const;

/**
 * One design cropped out of its catalogue page image (no extra assets).
 * Shown only at thumbnail size, so the ~475px-wide crop is never upscaled.
 */
function DesignCrop({ design }: { design: EngageDesign }) {
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
        alt=""
        draggable={false}
        loading="lazy"
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
 * catalogue design as a thumbnail in ONE horizontal row (Ralf, Oct 26) so the
 * $2,000 CAD down-payment button below stays on screen. Scroll-snap + smooth
 * scrolling, a partial next tile as the scroll hint, arrows on desktop, swipe
 * on touch. Each tile is a Select / Selected toggle (multi-select); no tile
 * links to the down payment. EngageSelection owns the selection and the one
 * "Engage Thorsten P" button that goes to ?step=pay.
 */
export default function EngageDesignGallery({
  designs,
  selected,
  onToggle,
}: {
  designs: EngageDesign[];
  selected: readonly string[];
  onToggle: (code: string) => void;
}) {
  const e = useT().talisu.engage;
  const rowRef = useRef<HTMLUListElement>(null);
  const [canBack, setCanBack] = useState(false);
  const [canMore, setCanMore] = useState(designs.length > 1);

  const updateArrows = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    setCanBack(row.scrollLeft > 4);
    setCanMore(row.scrollLeft + row.clientWidth < row.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const row = rowRef.current;
    if (!row || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateArrows);
    observer.observe(row);
    return () => observer.disconnect();
  }, [updateArrows]);

  function scrollByPage(direction: 1 | -1) {
    const row = rowRef.current;
    if (!row) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    row.scrollBy({
      left: direction * Math.max(row.clientWidth * 0.8, 160),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  const arrowClass =
    "absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[18px] leading-none text-[#046BD9] shadow-[0_2px_10px_rgba(0,0,0,0.18)] ring-1 ring-black/10 transition hover:bg-[#046BD9] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#046BD9] disabled:pointer-events-none disabled:opacity-0 md:flex";

  return (
    <div className="relative min-w-0" data-testid="engage-design-gallery">
      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        disabled={!canBack}
        aria-label={e.galleryScrollBack}
        data-testid="engage-gallery-prev"
        className={`${arrowClass} -left-3`}
      >
        <span aria-hidden>‹</span>
      </button>
      <ul
        ref={rowRef}
        onScroll={updateArrows}
        className="flex snap-x snap-mandatory scroll-px-2 gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth rounded-xl border border-black/5 bg-white/60 p-2 [scrollbar-width:thin] motion-reduce:scroll-auto sm:gap-2.5"
        data-testid="engage-design-grid"
      >
        {designs.map((design) => {
          const name = design.name ?? e.galleryDefaultName;
          const isSelected = selected.includes(design.code);
          return (
            <li
              key={design.code}
              // Fixed tile width: ~3.1–3.6 tiles on desktop, ~2.4 on phones, so
              // the next tile always peeks in as the scroll hint.
              className="w-[8.5rem] shrink-0 snap-start sm:w-[9.75rem]"
              data-testid="engage-design-tile"
            >
              <button
                type="button"
                onClick={() => onToggle(design.code)}
                aria-pressed={isSelected}
                aria-label={`${design.code} · ${name}`}
                data-testid="engage-design"
                data-product-code={design.code}
                data-selected={isSelected ? "true" : "false"}
                draggable={false}
                className={`group relative flex h-full w-full flex-col overflow-hidden rounded-lg bg-white text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#046BD9] focus-visible:ring-offset-1 ${
                  isSelected
                    ? "ring-2 ring-[#046BD9]"
                    : "ring-1 ring-black/10 hover:ring-2 hover:ring-[#046BD9]/60"
                }`}
              >
                <DesignCrop design={design} />
                {isSelected ? (
                  <span
                    aria-hidden
                    data-testid="engage-design-check"
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#046BD9] text-[12px] font-bold leading-none text-white shadow ring-2 ring-white"
                  >
                    ✓
                  </span>
                ) : null}
                <span className="block px-1.5 pt-1 leading-tight">
                  <span className="block text-[11px] font-semibold text-[#046BD9] sm:text-[12px]">
                    {design.code}
                  </span>
                  <span className="block truncate text-[10px] text-neutral-600 sm:text-[11px]">
                    {name}
                  </span>
                </span>
                <span className="mt-auto block p-1.5">
                  <span
                    data-testid="engage-design-select"
                    className={`flex min-h-7 w-full items-center justify-center gap-1 rounded-2xl px-1.5 py-1 text-center text-[11px] leading-tight font-semibold transition sm:text-[12px] ${
                      isSelected
                        ? "bg-[#046BD9] text-white"
                        : "bg-white text-[#046BD9] ring-1 ring-inset ring-[#046BD9]/50 group-hover:bg-[#046BD9]/[0.06]"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <span aria-hidden>✓</span>
                        {e.gallerySelected}
                      </>
                    ) : (
                      e.gallerySelect
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => scrollByPage(1)}
        disabled={!canMore}
        aria-label={e.galleryScrollMore}
        data-testid="engage-gallery-next"
        className={`${arrowClass} -right-3`}
      >
        <span aria-hidden>›</span>
      </button>
    </div>
  );
}
