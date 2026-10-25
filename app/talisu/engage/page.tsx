import Image from "next/image";
import Link from "next/link";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import { TALISU_CARD } from "@/lib/talisu/ui";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { fmt } from "@/lib/i18n/format";
import SectionShell from "@/components/talisu/SectionShell";
import SamCartEmbed from "@/components/talisu/SamCartEmbed";
import AdviserLayout from "@/components/talisu/AdviserLayout";
import TopBoundFlipbook from "@/components/product-flipbook/TopBoundFlipbook";
import { loadCataloguePages } from "@/lib/talisu/catalogue-pages";
import {
  isTalisUEngageCheckoutStep,
  talisUEngageCheckoutHref,
} from "@/lib/talisu/ask-step";
import {
  CATALOGUE_PATH,
  catalogueProductCheckoutUrl,
  findCatalogueProduct,
} from "@/lib/talisu/catalogue-products";
import {
  engageStructureCheckoutUrl,
  normalizeEngageStructure,
} from "@/lib/talisu/engage-structure";

export async function generateMetadata() {
  const locale = await getLocale();
  const m = getDictionary(locale).meta.talisuEngage;
  return createTalisUMetadata({
    title: m.title,
    description: m.description,
    path: "/talisu/engage",
    locale,
    // Dedicated share card (Thorsten P + tree logo), not the shared brand card.
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
    structure?: string | string[];
  }>;
};

export default async function TalisUEngagePage({
  searchParams,
}: TalisUEngagePageProps) {
  const dictionary = getDictionary(await getLocale());
  const t = dictionary.talisu;
  const TALISU_ENGAGE = t.engage;
  const params = (await searchParams) ?? {};
  // Catalogue hotspots link here as ?product=P07. Unknown codes are ignored.
  const product = findCatalogueProduct(params.product);
  // Structure from older landing links (?structure=), limited to the four ids.
  const structure = normalizeEngageStructure(params.structure);
  const structureSection = structure
    ? (dictionary.home.ownershipSections.find((s) => s.id === structure) ??
      null)
    : null;
  const checkoutUrl = engageStructureCheckoutUrl(
    catalogueProductCheckoutUrl(TALISU_ENGAGE.samcartUrl, product),
    structure,
  );

  // Adviser landing (Oct 26): Thorsten P's portrait + the Talishouse™
  // catalogue flipbook. Each unit links to the $2,000 CAD down-payment
  // checkout (?step=pay&product=Pxx); the button below goes there too,
  // keeping a catalogue ?product= code. Older ?structure= links still work:
  // the value is carried to the checkout and shown there.
  if (!isTalisUEngageCheckoutStep(params.step)) {
    const pages = loadCataloguePages();
    return (
      <AdviserLayout
        testId="talisu-engage-landing"
        imageSrc={TALISU_ENGAGE.partnerImage}
        imageAlt={TALISU_ENGAGE.partnerImageAlt}
        imagePosition="center 18%"
        kicker={TALISU_ENGAGE.adviserKicker}
        title={TALISU_ENGAGE.adviserTitle}
      >
        <section
          className="mt-4 sm:mt-6"
          data-testid="engage-catalogue"
          aria-label={TALISU_ENGAGE.catalogueLabel}
        >
          <div className="mb-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600">
            {TALISU_ENGAGE.catalogueLabel}
          </div>
          <TopBoundFlipbook
            pages={pages}
            title={TALISU_ENGAGE.catalogueLabel}
            showHeader={false}
            variant="embedded"
          />
          <div className="mt-1 text-center text-[12.5px] text-neutral-600" data-testid="engage-catalogue-hint">
            {TALISU_ENGAGE.catalogueHint}
          </div>
        </section>
        {product ? (
          <div
            className="mt-4 inline-block self-start rounded-2xl border border-[#046BD9]/25 bg-white px-4 py-3 text-[14px] text-neutral-800 shadow-sm sm:text-[15px]"
            data-testid="engage-ask-product"
          >
            <span className="font-semibold text-[#046BD9]">{t.engageCustomizing}</span>{" "}
            <span className="font-semibold text-neutral-950">{product.code}</span>
            {" — "}
            {product.title}
          </div>
        ) : null}
        <div className="mt-5 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Link
            href={talisUEngageCheckoutHref(product?.code, structure)}
            data-testid="partner-cta"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#046BD9] px-6 text-[15px] font-semibold text-white shadow-[0_6px_14px_rgba(4,107,217,0.3)] transition hover:bg-[#0358b3] sm:text-[16px]"
          >
            {t.engageWebster}
            <span aria-hidden>→</span>
          </Link>
          <div className="text-[12.5px] text-neutral-600 sm:text-[13px]">
            {TALISU_ENGAGE.adviserCtaNote}
          </div>
        </div>
        <div className="mt-6 text-[13px] text-neutral-600" data-testid="talisu-engage-partner">
          <span className="font-semibold text-neutral-900">{TALISU_ENGAGE.partnerName}</span>
          {" · "}
          {TALISU_ENGAGE.landingRole}
        </div>
      </AdviserLayout>
    );
  }

  // Thorsten P's clients pay the down payment directly and set up their Mapsite
  // afterwards, so this checkout is open to every visitor (no PMC gate).

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
              width={800}
              height={800}
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
              <span className="font-semibold text-[#046BD9]">
                {t.engageCustomizing}
              </span>{" "}
              <span className="font-semibold text-neutral-950">
                {product.code}
              </span>
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
          {structureSection ? (
            <div
              className="mb-4 rounded-2xl border border-[#046BD9]/25 bg-white px-4 py-3 text-sm text-neutral-800 shadow-sm sm:text-base"
              data-testid="engage-structure"
              data-structure-id={structureSection.id}
            >
              <span className="font-semibold text-[#046BD9]">
                {t.engageStructure}
              </span>{" "}
              <span className="font-semibold text-neutral-950">
                {structureSection.title}
              </span>{" "}
              <Link
                href={`/talisu/engage${
                  product ? `?product=${encodeURIComponent(product.code)}` : ""
                }`}
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
