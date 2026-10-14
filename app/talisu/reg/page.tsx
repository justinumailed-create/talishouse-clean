import Image from "next/image";
import { enforcePmcRegistrationGate, firstParam } from "@/lib/talisu/pmc-gate";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import { TALISU_CARD } from "@/lib/talisu/ui";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE } from "@/lib/talispros/market-pages";
import SectionShell from "@/components/talisu/SectionShell";
import SamCartEmbed from "@/components/talisu/SamCartEmbed";
import PartnerLanding, { type PartnerLandingIcon } from "@/components/talisu/PartnerLanding";
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
  searchParams?: Promise<{ step?: string | string[]; fastCode?: string | string[] }>;
};

export default async function TalisURegisterPage({
  searchParams,
}: TalisURegisterPageProps) {
  const TALISU_REGISTER = getDictionary(await getLocale()).talisu.register;
  const params = (await searchParams) ?? {};

  // Conversion landing first (Ralf): Aisha's hero + the four offerings. The
  // SamCart register checkout only renders after the CTA (?step=register, same tab).
  // No "select URL in the flag" box — visitors already arrive here from the URL flag.
  if (!isTalisURegisterCheckoutStep(params.step)) {
    const icons: PartnerLandingIcon[] = ["map", "book", "chart", "tv"];
    return (
      <PartnerLanding
        testId="talisu-register-landing"
        kicker={TALISU_REGISTER.landingKicker}
        title={TALISU_REGISTER.landingTitle}
        lead={TALISU_REGISTER.landingLead}
        imageSrc={MAPSITE_MARKET_PARTNER_FALLBACK_IMAGE}
        imageAlt="Aisha C."
        imageWidth={896}
        imageHeight={1200}
        partnerName={TALISU_REGISTER.partnerName.split(/ [—–-] /)[0] ?? "Aisha C."}
        partnerRole={TALISU_REGISTER.partnerHeading}
        ctaLabel={TALISU_REGISTER.ctaLabel}
        ctaHref={talisURegisterCheckoutHref()}
        ctaNote={TALISU_REGISTER.ctaNote}
        intro={<p>{TALISU_REGISTER.partnerIntro}</p>}
        cardsHeading={TALISU_REGISTER.offeringsHeading}
        cards={TALISU_REGISTER.bullets.map((b, i) => ({
          icon: icons[i] ?? "spark",
          label: b.label,
          text: b.text.charAt(0).toUpperCase() + b.text.slice(1),
        }))}
        closingTitle={TALISU_REGISTER.closingTitle}
        closingText={TALISU_REGISTER.closing}
      />
    );
  }

  // PMC gate (every registrant): Demo → claim Mapsite → Talispros → Media
  // Directory → Contract (agent code) → sign → here → payment. No claimed
  // Mapsite → demo/claim start; unsigned → the sequence. Paid users pass.
  await enforcePmcRegistrationGate(firstParam(params.fastCode));

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
