import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import WorkingPageShell from "@/components/talispros/WorkingPageShell";
import WorkingPageCtaLink from "@/components/talispros/WorkingPageCtaLink";

export type PartnerLandingIcon =
  | "map"
  | "book"
  | "chart"
  | "tv"
  | "design"
  | "credit"
  | "queue"
  | "spark"
  | "shield";

const ICON_PATHS: Record<PartnerLandingIcon, ReactNode> = {
  map: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4M4 20h16" />
      <path d="m8 15 3.5-4 3 2.5L19 8" />
    </>
  ),
  tv: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="m9 3 3 3 3-3M8 21h8" />
    </>
  ),
  design: (
    <>
      <path d="M3 21h18M5 21V9l7-5 7 5v12" />
      <path d="M10 21v-6h4v6" />
    </>
  ),
  credit: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18M7 15h3" />
    </>
  ),
  queue: (
    <>
      <path d="M3 7h13M3 12h13M3 17h9" />
      <path d="m18 15 3 3-3 3" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v6c0 4.5 3.2 8 7.5 9 4.3-1 7.5-4.5 7.5-9V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
};

export function PartnerIcon({ name, className = "h-6 w-6" }: { name: PartnerLandingIcon; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

export type PartnerLandingCard = {
  icon: PartnerLandingIcon;
  label: string;
  text: string;
};

/**
 * Partner landing (Aisha on /talisu/reg, Webster on /talisu/engage), in the
 * Catalogue design (Ralf, Oct 18): beige surface, ~1,400 px, one headline
 * line + Team Leader link on top, nothing below the bottom of a ~1440×800
 * screen. Z-pattern: partner + extras in the left column, title / offerings
 * on the right, the primary CTA bottom right. The SamCart step still only
 * renders after the CTA (same tab, visitor must click).
 */
export default function PartnerLanding({
  testId,
  kicker,
  title,
  lead,
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  partnerName,
  partnerRole,
  ctaLabel,
  ctaHref,
  ctaNote,
  intro,
  cardsHeading,
  cards,
  belowCards,
  closingTitle,
  closingText,
  notice,
  left,
  mainCta,
  headlineCtaHref,
}: {
  testId?: string;
  kicker: string;
  title: string;
  lead: string;
  imageSrc: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  partnerName: string;
  partnerRole: string;
  ctaLabel: string;
  ctaHref: string;
  ctaNote?: string;
  intro?: ReactNode;
  cardsHeading?: string;
  cards: PartnerLandingCard[];
  belowCards?: ReactNode;
  closingTitle: string;
  closingText?: string;
  notice?: ReactNode;
  /**
   * Left-column content under the title (Webster: the CSFT buttons, in the
   * same place as on /talisu/discuss). Without it the left column is the
   * partner card and the title sits on the right.
   */
  left?: ReactNode;
  /** Replaces the default bottom-right CTA (Webster: live structure button). */
  mainCta?: ReactNode;
  /** Headline pill target when it differs from ctaHref (Webster: #structures). */
  headlineCtaHref?: string;
}) {
  const heading = (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#046BD9]">
        {kicker}
      </p>
      <h1 className="mt-1 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-neutral-950 sm:text-[34px]">
        {title}
      </h1>
    </div>
  );

  const partnerCard = (
    <figure
      className="flex items-center gap-4 rounded-[24px] bg-white p-3 pr-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.06)]"
      data-testid="partner-card"
    >
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={imageWidth}
        height={imageHeight}
        priority
        sizes="120px"
        className="h-[132px] w-[110px] shrink-0 rounded-[18px] object-cover object-top"
      />
      <figcaption className="min-w-0">
        <span className="block text-[17px] font-semibold text-neutral-950">{partnerName}</span>
        <span className="block text-[14px] text-[#046BD9]">{partnerRole}</span>
        {ctaNote ? (
          <span className="mt-2 block text-[12.5px] leading-snug text-neutral-500">{ctaNote}</span>
        ) : null}
      </figcaption>
    </figure>
  );

  const cardList =
    cards.length > 0 ? (
      <div>
        {cardsHeading ? (
          <h2 className="mb-2.5 text-[15px] font-semibold tracking-tight text-neutral-900">
            {cardsHeading}
          </h2>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.label}
              className="flex gap-3 rounded-[20px] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_28px_rgba(0,0,0,0.05)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#046BD9]/10 text-[#046BD9]">
                <PartnerIcon name={card.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-[14.5px] font-semibold text-neutral-950">{card.label}</h3>
                <p className="mt-1 text-[12.5px] leading-[1.45] text-neutral-600">{card.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    ) : null;

  // Z-pattern end: closing line + the primary CTA, bottom right.
  const closingCopy = (
    <div className="min-w-0 max-w-[36rem]">
      <p className="text-[17px] font-semibold leading-snug tracking-[-0.01em] text-neutral-950">
        {closingTitle}
      </p>
      {closingText ? (
        <p className="mt-0.5 text-[13.5px] leading-snug text-neutral-600">{closingText}</p>
      ) : null}
    </div>
  );

  // With the default left column the closing line moves there (overflow to
  // the left, Ralf Oct 18) and the CTA alone ends the Z bottom right.
  const closing = (
    <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-3 pt-1">
      {left ? <div className="mr-auto">{closingCopy}</div> : null}
      {mainCta ?? (
        <Link
          href={ctaHref}
          data-testid="partner-cta"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#046BD9] px-8 text-[16px] font-semibold text-white shadow-[0_10px_26px_rgba(4,107,217,0.3)] transition hover:bg-[#0558b3] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#046BD9]/30"
        >
          {ctaLabel}
          <span aria-hidden className="text-lg leading-none">→</span>
        </Link>
      )}
    </div>
  );

  const introBlock = intro ? (
    <div className="text-[14.5px] leading-relaxed text-neutral-700">{intro}</div>
  ) : null;

  // Without a custom left slot: partner card + intro fill the left column.
  const defaultLeft = (
    <div className="space-y-4">
      {partnerCard}
      {introBlock}
      {closingCopy}
    </div>
  );

  const main = (
    <div className="space-y-4">
      {left ? partnerCard : heading}
      {notice}
      {left ? introBlock : null}
      {cardList}
      {belowCards}
      {closing}
    </div>
  );

  return (
    <WorkingPageShell
      testId={testId}
      leftWidth={left ? "44rem" : "24rem"}
      headline={lead}
      headlineAction={
        <WorkingPageCtaLink
          href={headlineCtaHref ?? ctaHref}
          label={ctaLabel}
          avatarSrc={imageSrc}
          avatarAlt={imageAlt}
          testId="partner-headline-cta"
        />
      }
      title={left ? heading : undefined}
      left={left ?? defaultLeft}
    >
      {main}
    </WorkingPageShell>
  );
}
