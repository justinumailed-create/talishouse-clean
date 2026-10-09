import Image from "next/image";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import { TALISU_CARD } from "@/lib/talisu/ui";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE } from "@/lib/talispros/market-pages";
import SectionShell from "@/components/talisu/SectionShell";
import SamCartEmbed from "@/components/talisu/SamCartEmbed";
import PartnerAskStep from "@/components/talisu/PartnerAskStep";
import {
  isTalisURegisterCheckoutStep,
  talisURegisterCheckoutHref,
} from "@/lib/talisu/ask-step";

export async function generateMetadata() {
  const locale = await getLocale();
  const m = getDictionary(locale).meta.talisuRegister;
  return createTalisUMetadata({
    title: m.title,
    description: m.description,
    path: "/talisu/reg",
    locale,
    // Dedicated share card (Aisha + tree logo), not the shared brand card.
    image: {
      url: m.ogImage,
      width: 1200,
      height: 630,
      alt: m.ogImageAlt,
    },
  });
}

type TalisURegisterPageProps = {
  searchParams?: Promise<{ step?: string | string[] }>;
};

export default async function TalisURegisterPage({
  searchParams,
}: TalisURegisterPageProps) {
  const TALISU_REGISTER = getDictionary(await getLocale()).talisu.register;
  const params = (await searchParams) ?? {};

  // Ask for the business first (Ralf): Aisha's write-up + Proceed. The SamCart
  // register checkout only renders after Proceed (?step=register, same tab).
  if (!isTalisURegisterCheckoutStep(params.step)) {
    return (
      <SectionShell title={TALISU_REGISTER.title}>
        <PartnerAskStep
          testId="talisu-register-ask"
          imageSrc={MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE}
          imageAlt="Aisha C."
          imageWidth={896}
          imageHeight={1200}
          heading={TALISU_REGISTER.partnerHeading}
          name={TALISU_REGISTER.partnerName}
          askHeading={TALISU_REGISTER.askHeading}
          askLine={TALISU_REGISTER.askLine}
          proceedLabel={TALISU_REGISTER.askProceed}
          proceedHref={talisURegisterCheckoutHref()}
        >
          <p>{TALISU_REGISTER.partnerIntro}</p>
          <ul className="mt-4 space-y-3 text-neutral-600">
            {TALISU_REGISTER.bullets.map((b) => (
              <li key={b.label}>
                <span className="font-semibold text-neutral-900">{b.label}:</span>{" "}
                {b.text}
              </li>
            ))}
          </ul>
          <p className="mt-4 font-medium text-[#0069CF]">
            {TALISU_REGISTER.closing}
          </p>
        </PartnerAskStep>
      </SectionShell>
    );
  }

  return (
    <SectionShell title={TALISU_REGISTER.title} maxWidthClass="max-w-[1920px]">
      {/* Partner write-up stays compact; SamCart gets the remaining width so its
          native two-column checkout (order + form) can sit side by side. */}
      <div className="mb-14 grid items-start gap-8 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
        <div className={TALISU_CARD}>
          <div className="mb-5 flex justify-center">
            <Image
              src={MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE}
              alt="Aisha C."
              width={896}
              height={1200}
              className="h-auto w-full max-w-[220px] rounded-xl object-cover shadow-sm"
              sizes="220px"
              priority
            />
          </div>
          <h2 className="text-xl font-semibold text-[#0069CF]">
            {TALISU_REGISTER.partnerHeading}
          </h2>
          <p className="mt-3 text-sm font-medium text-neutral-950">
            {TALISU_REGISTER.partnerName}
          </p>
          <p className="mt-3 text-sm text-neutral-700">
            {TALISU_REGISTER.partnerIntro}
          </p>
          <ul className="mt-4 space-y-3 text-sm text-neutral-600">
            {TALISU_REGISTER.bullets.map((b) => (
              <li key={b.label}>
                <span className="font-semibold text-neutral-900">{b.label}:</span>{" "}
                {b.text}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-medium text-[#0069CF]">
            {TALISU_REGISTER.closing}
          </p>
        </div>

        <div className="min-w-0">
          <SamCartEmbed
            src={TALISU_REGISTER.samcartUrl}
            title="TalisU Register — SamCart"
            height={1500}
          />
        </div>
      </div>
    </SectionShell>
  );
}
