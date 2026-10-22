import { enforcePmcRegistrationGate, firstParam } from "@/lib/talisu/pmc-gate";
import Image from "next/image";
import Link from "next/link";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import { TALISU_CARD } from "@/lib/talisu/ui";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { fmt } from "@/lib/i18n/format";
import SectionShell from "@/components/talisu/SectionShell";
import SamCartEmbed from "@/components/talisu/SamCartEmbed";
import PartnerLanding from "@/components/talisu/PartnerLanding";
import { TransactionStructurePickerStandalone } from "@/components/talisu/TransactionStructurePicker";
import {
  isTalisUEngageCheckoutStep,
  talisUEngageCheckoutHref,
} from "@/lib/talisu/ask-step";
import {
  CATALOGUE_PATH,
  catalogueProductCheckoutUrl,
  findCatalogueProduct,
} from "@/lib/talisu/catalogue-products";

export async function generateMetadata() {
  const locale = await getLocale();
  const m = getDictionary(locale).meta.talisuEngage;
  return createTalisUMetadata({
    title: m.title,
    description: m.description,
    path: "/talisu/engage",
    locale,
    // Dedicated share card (Webster + tree logo), not the shared brand card.
    image: {
      url: m.ogImage,
      width: 1200,
      height: 630,
      alt: m.ogImageAlt,
    },
  });
}

type TalisUEngagePageProps = {
  searchParams?: Promise<{
    product?: string | string[];
    step?: string | string[];
    fastCode?: string | string[];
  }>;
};

export default async function TalisUEngagePage({
  searchParams,
}: TalisUEngagePageProps) {
  const t = getDictionary(await getLocale()).talisu;
  const TALISU_ENGAGE = t.engage;
  const params = (await searchParams) ?? {};
  // Catalogue hotspots link here as ?product=P07. Unknown codes are ignored.
  const product = findCatalogueProduct(params.product);
  const checkoutUrl = catalogueProductCheckoutUrl(
    TALISU_ENGAGE.samcartUrl,
    product,
  );

  // Landing first (Ralf, Oct 18): Catalogue design, Webster's one-line intro,
  // the CSFT buttons in the left column (explanations open below them, same
  // place as on /talisu/discuss). The down-payment checkout only renders
  // after the CTA (?step=pay, same tab); a catalogue ?product= code is
  // carried through.
  if (!isTalisUEngageCheckoutStep(params.step)) {
    return (
      <PartnerLanding
        testId="talisu-engage-landing"
        kicker={TALISU_ENGAGE.landingKicker}
        title={TALISU_ENGAGE.title}
        lead={TALISU_ENGAGE.landingLead}
        imageSrc={TALISU_ENGAGE.partnerImage}
        imageAlt={TALISU_ENGAGE.partnerImageAlt}
        imageWidth={864}
        imageHeight={1152}
        partnerName={TALISU_ENGAGE.partnerName.split(/ [—–-] /)[0] ?? "Webster M."}
        partnerRole={TALISU_ENGAGE.landingRole}
        ctaLabel={TALISU_ENGAGE.ctaLabel}
        ctaHref={talisUEngageCheckoutHref(product?.code)}
        left={
          <TransactionStructurePickerStandalone
            initialOpenId="conventional"
            testId="engage-structures"
          />
        }
        intro={<p>{TALISU_ENGAGE.landingIntro}</p>}
        notice={
          product ? (
            <p
              className="inline-block rounded-2xl border border-[#046BD9]/25 bg-white px-4 py-3 text-[15px] text-neutral-800 shadow-sm"
              data-testid="engage-ask-product"
            >
              <span className="font-semibold text-[#046BD9]">{t.engageCustomizing}</span>{" "}
              <span className="font-semibold text-neutral-950">{product.code}</span>
              {" — "}
              {product.title}
            </p>
          ) : null
        }
        cards={[]}
        closingTitle={TALISU_ENGAGE.headline}
        closingText={TALISU_ENGAGE.ctaNote}
      />
    );
  }

  // PMC gate (every registrant) before the down-payment checkout.
  await enforcePmcRegistrationGate(firstParam(params.fastCode));

  return (
    <SectionShell
      title={TALISU_ENGAGE.title}
      subtitle={TALISU_ENGAGE.headline}
      maxWidthClass="max-w-[1920px]"
    >
      {/* Partner write-up stays compact; SamCart gets the remaining width so its
          native two-column checkout (order + form) can sit side by side. */}
      <div className="mb-14 grid items-start gap-8 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
        <div className={TALISU_CARD}>
          <div className="mb-5 flex justify-center">
            <Image
              src={TALISU_ENGAGE.partnerImage}
              alt={TALISU_ENGAGE.partnerImageAlt}
              width={864}
              height={1152}
              className="h-auto w-full max-w-[220px] rounded-xl object-cover shadow-sm"
              sizes="220px"
              priority
            />
          </div>
          <h2 className="text-xl font-semibold text-[#0069CF]">
            {TALISU_ENGAGE.partnerHeading}
          </h2>
          <p className="mt-3 text-sm font-medium text-neutral-950">
            {TALISU_ENGAGE.partnerName}
          </p>
          <div className="mt-3 space-y-3 text-sm text-neutral-700">
            {TALISU_ENGAGE.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <h3 className="mt-4 text-sm font-semibold text-neutral-900">
            {TALISU_ENGAGE.helpHeading}
          </h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-neutral-600">
            {TALISU_ENGAGE.helpItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3 className="mt-4 text-sm font-semibold text-neutral-900">
            {TALISU_ENGAGE.protectionHeading}
          </h3>
          <p className="mt-2 text-sm text-neutral-700">
            {TALISU_ENGAGE.protectionText}
          </p>
        </div>

        <div className="min-w-0">
          {product ? (
            <div
              className="mb-4 rounded-2xl border border-[#046BD9]/25 bg-white px-4 py-3 text-sm text-neutral-800 shadow-sm sm:text-base"
              data-testid="engage-product"
              data-product-code={product.code}
            >
              <span className="font-semibold text-[#046BD9]">{t.engageCustomizing}</span>{" "}
              <span className="font-semibold text-neutral-950">{product.code}</span>
              {" — "}
              {product.title}
              <span className="text-neutral-500">
                {" "}
                · {fmt(t.engageCataloguePage, { page: product.cataloguePage })}
              </span>{" "}
              <Link
                href={CATALOGUE_PATH}
                className="whitespace-nowrap font-medium text-[#046BD9] hover:underline"
              >
                {t.engageChange}
              </Link>
            </div>
          ) : null}
          <SamCartEmbed
            key={checkoutUrl}
            src={checkoutUrl}
            title="TalisU Engage — SamCart"
            height={1500}
          />
        </div>
      </div>
    </SectionShell>
  );
}
