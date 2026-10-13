import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

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
 * Conversion-focused partner landing (Aisha on /talisu/reg, Webster on
 * /talisu/engage): large hero with the partner photo, big readable type,
 * icon cards for the offerings and a strong primary CTA into the existing
 * SamCart step (same tab, visitor must click).
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
  cardsHeading: string;
  cards: PartnerLandingCard[];
  belowCards?: ReactNode;
  closingTitle: string;
  closingText?: string;
  notice?: ReactNode;
}) {
  const cta = (extra = "") => (
    <Link
      href={ctaHref}
      data-testid="partner-cta"
      className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#046BD9] px-9 text-[17px] font-semibold text-white shadow-[0_12px_30px_rgba(4,107,217,0.35)] transition hover:-translate-y-0.5 hover:bg-[#0558b3] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#046BD9]/30 ${extra}`}
    >
      {ctaLabel}
      <span aria-hidden className="text-xl leading-none">→</span>
    </Link>
  );

  return (
    <div data-testid={testId} className="text-neutral-900">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-[#eef4fc]">
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-[#046BD9]/10 blur-2xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:py-20">
          <div className="order-2 lg:order-1">
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#046BD9]">
              {kicker}
            </p>
            <h1 className="mt-4 text-[36px] font-semibold leading-[1.08] tracking-[-0.03em] text-neutral-950 sm:text-[48px] lg:text-[56px]">
              {title}
            </h1>
            <p className="mt-5 max-w-xl text-[18px] leading-relaxed text-neutral-600 sm:text-[20px]">
              {lead}
            </p>
            {notice ? <div className="mt-5">{notice}</div> : null}
            <div className="mt-8 flex flex-col items-start gap-3">
              {cta("w-full sm:w-auto")}
              {ctaNote ? (
                <p className="text-[14px] text-neutral-500">{ctaNote}</p>
              ) : null}
            </div>
          </div>
          <div className="order-1 flex justify-center lg:order-2">
            <figure className="relative w-full max-w-[340px] sm:max-w-[380px]">
              <div aria-hidden className="absolute inset-0 translate-x-4 translate-y-4 rounded-[32px] bg-[#046BD9]/15" />
              <Image
                src={imageSrc}
                alt={imageAlt}
                width={imageWidth}
                height={imageHeight}
                priority
                sizes="(min-width: 1024px) 380px, 80vw"
                className="relative aspect-[4/5] w-full rounded-[32px] object-cover object-top shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
              />
              <figcaption className="absolute -bottom-5 left-1/2 w-[86%] -translate-x-1/2 rounded-2xl bg-white px-5 py-3 text-center shadow-[0_12px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
                <span className="block text-[17px] font-semibold text-neutral-950">{partnerName}</span>
                <span className="block text-[14px] text-[#046BD9]">{partnerRole}</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Offerings */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
        {intro ? (
          <div className="mx-auto mb-10 max-w-3xl text-center text-[18px] leading-relaxed text-neutral-700 sm:text-[20px]">
            {intro}
          </div>
        ) : null}
        <h2 className="text-center text-[28px] font-semibold tracking-[-0.02em] text-neutral-950 sm:text-[36px]">
          {cardsHeading}
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.label}
              className="group rounded-[24px] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_36px_rgba(0,0,0,0.07)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(4,107,217,0.15)] sm:p-8"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#046BD9]/10 text-[#046BD9] transition group-hover:bg-[#046BD9] group-hover:text-white">
                <PartnerIcon name={card.icon} />
              </span>
              <h3 className="mt-5 text-[21px] font-semibold tracking-[-0.01em] text-neutral-950">
                {card.label}
              </h3>
              <p className="mt-3 text-[16px] leading-relaxed text-neutral-600 sm:text-[17px]">
                {card.text}
              </p>
            </article>
          ))}
        </div>
        {belowCards ? <div className="mt-8">{belowCards}</div> : null}
      </section>

      {/* Closing CTA */}
      <section className="px-5 pb-16 sm:pb-24">
        <div className="mx-auto max-w-4xl rounded-[32px] bg-gradient-to-br from-[#046BD9] to-[#063f86] px-6 py-12 text-center text-white shadow-[0_24px_60px_rgba(4,107,217,0.3)] sm:px-12">
          <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[36px]">
            {closingTitle}
          </h2>
          {closingText ? (
            <p className="mx-auto mt-3 max-w-2xl text-[17px] leading-relaxed text-white/85">
              {closingText}
            </p>
          ) : null}
          <Link
            href={ctaHref}
            className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-9 text-[17px] font-semibold text-[#046BD9] shadow-lg transition hover:-translate-y-0.5"
          >
            {ctaLabel}
            <span aria-hidden className="text-xl leading-none">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
