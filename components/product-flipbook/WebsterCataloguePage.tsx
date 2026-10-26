"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/format";
import { ADVISER_METAL_BG } from "@/components/talisu/AdviserLayout";
import {
  METAL_TAB,
  METAL_TAB_LABEL,
  METAL_TAB_SHEEN,
  METAL_TAB_UNSELECTED,
} from "@/components/talisu/metal-tab";

function stopFlip(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

/** One visible catalogue page the closing page can jump back to. */
export type CatalogueJumpTarget = {
  /** Printed page number (T-House = 1, Design Ideas from 20). */
  number: number;
  /** Leaf index in the flipbook. */
  index: number;
};

/**
 * Closing page of the Talishouse™ Product Catalogue (back cover leaf).
 * Thorsten P's photo (left) and, on the right, one metal-tab button per
 * visible page (hidden pages are not in the leaf list, so never offered)
 * plus the Engage Thorsten P CTA.
 */
export default function WebsterCataloguePage({
  targets = [],
  onJump,
  ctaHref,
  interactive = true,
}: {
  targets?: CatalogueJumpTarget[];
  onJump?: (index: number) => void;
  /** Engage CTA target (the $2,000 CAD down-payment flow). */
  ctaHref: string;
  /** False while the page is the turning sheet: buttons are inert. */
  interactive?: boolean;
}) {
  const t = useT();
  const engage = t.talisu.engage;
  const c = t.catalogueUi;

  return (
    <article className="product-flipbook__partner product-flipbook__closing" data-testid="catalogue-webster-page">
      <div className="product-flipbook__partner-photo">
        {/* Native img: next/image fill was painting catalogue pages against the viewport. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={engage.partnerImage}
          alt={engage.partnerImageAlt}
          draggable={false}
          decoding="async"
        />
      </div>
      <div className="product-flipbook__partner-copy product-flipbook__closing-copy">
        <h2>{engage.partnerHeading}</h2>
        <p className="product-flipbook__partner-name" data-testid="catalogue-closing-name">
          {c.closingPartnerName}
        </p>
        <nav
          className="product-flipbook__closing-nav"
          aria-label={c.pageButtonsLabel}
          data-testid="catalogue-page-buttons"
        >
          <p className="product-flipbook__closing-nav-label">{c.pageButtonsLabel}</p>
          <div className="product-flipbook__closing-grid">
            {targets.map((target) => (
              <button
                key={target.index}
                type="button"
                data-testid="catalogue-page-button"
                data-page={target.number}
                tabIndex={interactive ? undefined : -1}
                disabled={!interactive}
                onPointerDown={stopFlip}
                onPointerUp={stopFlip}
                onClick={(event) => {
                  event.stopPropagation();
                  if (interactive) onJump?.(target.index);
                }}
                className={`${METAL_TAB} ${METAL_TAB_UNSELECTED} product-flipbook__closing-tab min-h-0! rounded-[0.5em]! px-[0.3em]! py-0! shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_0_-1px_0_rgba(0,0,0,0.22),0_2px_5px_rgba(0,0,0,0.2)]!`}
                style={{ backgroundImage: ADVISER_METAL_BG }}
              >
                <span className={METAL_TAB_SHEEN} aria-hidden />
                <span className={`${METAL_TAB_LABEL} whitespace-nowrap text-[1em]! sm:text-[1em]!`}>
                  {fmt(c.pageButton, { page: target.number })}
                </span>
              </button>
            ))}
          </div>
        </nav>
        <Link
          href={ctaHref}
          className="product-flipbook__partner-cta"
          data-testid="catalogue-webster-customize"
          tabIndex={interactive ? undefined : -1}
          onPointerDown={stopFlip}
          onPointerUp={stopFlip}
          onClick={stopFlip}
        >
          {t.talisu.engageWebster} <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}
