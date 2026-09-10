import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  mapsiteScheduleHref,
  mapsiteTebHref,
  mapsiteTtvHref,
} from "@/lib/mapsite-layout";

interface MapSiteCreativeLinksProps {
  fastCode: string;
  tebHref?: string;
  ttvHref?: string;
  scheduleHref?: string;
  brokerageName?: string;
  brokerageLogoUrl?: string | null;
  brokerageWebsite?: string | null;
}

function WordmarkBlock({
  href,
  wordmark,
  children,
  actions,
}: {
  href: string;
  wordmark: string;
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <article className="flex min-h-0 flex-col justify-center lg:flex-1">
      <h2 className="m-0">
        <Link
          href={href}
          className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 py-2.5 text-[clamp(3.75rem,8vw,7.5rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-[#1d1d1f] no-underline shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 sm:px-7 sm:py-3.5"
        >
          {wordmark}
        </Link>
      </h2>
      <div className="mt-5 max-w-md text-[17px] leading-snug text-[#6e6e73] sm:mt-6 sm:text-xl">
        {children}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 sm:mt-7">
        {actions}
      </div>
    </article>
  );
}

function TextAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center text-[17px] font-medium text-[#06c] no-underline transition-opacity hover:opacity-70"
    >
      {children}
    </Link>
  );
}

export default function MapSiteCreativeLinks({
  fastCode,
  ttvHref,
  scheduleHref,
  brokerageName,
  brokerageLogoUrl,
  brokerageWebsite,
}: MapSiteCreativeLinksProps) {
  const code = fastCode.trim().toUpperCase() || "this FAST Code";
  const tebLink = mapsiteTebHref(fastCode);
  const ttvLink = mapsiteTtvHref(ttvHref);
  const scheduleLink = scheduleHref?.trim() || mapsiteScheduleHref(fastCode);
  const brokerage = brokerageName?.trim() || "";
  const logo = brokerageLogoUrl?.trim() || "";
  const site = brokerageWebsite?.trim() || "";

  return (
    <div className="flex min-h-0 flex-col gap-16 lg:h-full lg:justify-center lg:gap-20">
      <WordmarkBlock
        href={tebLink}
        wordmark="TEB"
        actions={<TextAction href={tebLink}>Open bookshelf</TextAction>}
      >
        <p className="m-0">
          The Talisbooks™ bookshelf for FAST Code {code} — every eBook associated
          with this Mapsite™.
        </p>
      </WordmarkBlock>

      <WordmarkBlock
        href={ttvLink}
        wordmark="TTV"
        actions={
          <>
            <TextAction href={ttvLink}>Open TalisTV™</TextAction>
            <TextAction href={scheduleLink}>TV Schedule</TextAction>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {logo ? (
            <div className="relative h-10 w-full max-w-[10rem]">
              <Image
                src={logo}
                alt={brokerage ? `${brokerage} logo` : "Brokerage logo"}
                fill
                className="object-contain object-left"
                sizes="160px"
              />
            </div>
          ) : null}
          {brokerage ? (
            site && /^https?:\/\//i.test(site) ? (
              <a
                href={site}
                target="_blank"
                rel="noreferrer"
                className="m-0 text-[17px] font-semibold text-[#1d1d1f] hover:opacity-70"
              >
                {brokerage}
              </a>
            ) : (
              <p className="m-0 text-[17px] font-semibold text-[#1d1d1f]">
                {brokerage}
              </p>
            )
          ) : null}
          <p className="m-0">
            {brokerage
              ? `Home of ${brokerage}'s In-House Online TV Channel.`
              : `Home of FAST Code ${code}'s In-House Online TV Channel.`}
          </p>
        </div>
      </WordmarkBlock>
    </div>
  );
}
