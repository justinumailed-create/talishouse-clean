"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { ROUTES } from "@/lib/routes";

function stopFlip(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

/**
 * Closing sheet of /catalogue (page 19, source page 38).
 * Photo and write-up are the Register → Product card (`t.talisu.engage`),
 * so English and German stay the same strings as /talisu/engage.
 */
export default function WebsterCataloguePage() {
  const engage = useT().talisu.engage;
  const customizeDesign = useT().catalogueUi.customizeDesign;

  return (
    <article className="product-flipbook__partner" data-testid="catalogue-webster-page">
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
      <div className="product-flipbook__partner-copy">
        <h2>{engage.partnerHeading}</h2>
        <p className="product-flipbook__partner-name">{engage.partnerName}</p>
        <div className="product-flipbook__partner-body">
          {engage.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="product-flipbook__partner-help">
          <h3>{engage.helpHeading}</h3>
          <ul>
            {engage.helpItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <p className="product-flipbook__partner-protection">
          <strong>{engage.protectionHeading}</strong> {engage.protectionText}
        </p>
        <Link
          href={ROUTES.TALISU_ENGAGE}
          className="product-flipbook__partner-cta"
          data-testid="catalogue-webster-customize"
          onPointerDown={stopFlip}
          onPointerUp={stopFlip}
          onClick={stopFlip}
        >
          {customizeDesign}
        </Link>
      </div>
    </article>
  );
}
