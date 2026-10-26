"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/format";
import { talisUEngageCheckoutHref } from "@/lib/talisu/ask-step";
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
 * catalogue design as a thumbnail. The whole tile, including its
 * "Reserve Pxx" button, goes straight to the $2,000 CAD down payment
 * tagged with the design's code (?step=pay&product=Pxx). No zoom.
 */
export default function EngageDesignGallery({ designs }: { designs: EngageDesign[] }) {
  const e = useT().talisu.engage;

  return (
    <ul
      className="grid max-h-[30rem] grid-cols-3 gap-2 overflow-y-auto overscroll-contain rounded-xl border border-black/5 bg-white/60 p-2 sm:max-h-[34rem] sm:gap-2.5 xl:grid-cols-4"
      data-testid="engage-design-grid"
    >
      {designs.map((design) => {
        const name = design.name ?? e.galleryDefaultName;
        return (
          <li key={design.code}>
            <Link
              href={talisUEngageCheckoutHref(design.code)}
              aria-label={`${fmt(e.galleryReserve, { code: design.code })} · ${name}`}
              data-testid="engage-design"
              data-product-code={design.code}
              className="group flex h-full w-full flex-col overflow-hidden rounded-lg bg-white text-left shadow-sm ring-1 ring-black/10 transition hover:ring-2 hover:ring-[#046BD9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#046BD9]"
            >
              <DesignCrop design={design} />
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
                  data-testid="engage-design-reserve"
                  // Narrow phones: long labels ("P100 reservieren") wrap onto two
                  // lines inside the button instead of overflowing it.
                  className="flex min-h-8 w-full items-center justify-center rounded-2xl bg-[#046BD9] px-1.5 py-1 text-center text-[10.5px] leading-tight font-semibold text-balance text-white transition group-hover:bg-[#0358b3] sm:text-[12px]"
                >
                  {fmt(e.galleryReserve, { code: design.code })}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
