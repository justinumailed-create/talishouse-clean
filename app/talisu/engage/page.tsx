import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import { TALISU_CARD } from "@/lib/talisu/ui";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { fmt } from "@/lib/i18n/format";
import SectionShell from "@/components/talisu/SectionShell";
import SamCartEmbed from "@/components/talisu/SamCartEmbed";
import AdviserLayout from "@/components/talisu/AdviserLayout";
import EngageSelection from "@/components/talisu/EngageSelection";
import { loadEngageDesigns } from "@/lib/talisu/engage-designs";
import { isTalisUEngageCheckoutStep } from "@/lib/talisu/ask-step";
import {
  engageLockReason,
  engageLockedHref,
  engageProductsCheckoutUrl,
  normalizeEngageLockReason,
  parseEngageProducts,
} from "@/lib/talisu/engage-lock";

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
    locked?: string | string[];
  }>;
};

export default async function TalisUEngagePage({
  searchParams,
}: TalisUEngagePageProps) {
  const dictionary = getDictionary(await getLocale());
  const t = dictionary.talisu;
  const TALISU_ENGAGE = t.engage;
  const params = (await searchParams) ?? {};
  // Catalogue hotspots link here as ?product=P07 (preselected); several
  // designs travel as ?product=P03,P07. Unknown codes are ignored.
  const products = parseEngageProducts(params.product);
  const productCodes = products.map((p) => p.code);

  // Adviser landing (Oct 26): Thorsten P's portrait + a single-row gallery of the
  // Talishouse™ catalogue designs (no flipbook here; /catalogue keeps it).
  // Tiles are Select toggles; the one "Engage Thorsten P" button below unlocks
  // once at least one design is selected (Thorsten's own path; nothing from
  // Aisha's page is needed), and is the only way to the $2,000 CAD down payment (?step=pay).
  if (!isTalisUEngageCheckoutStep(params.step)) {
    const designs = loadEngageDesigns();
    return (
      <AdviserLayout
        testId="talisu-engage-landing"
        imageSrc={TALISU_ENGAGE.partnerImage}
        imageAlt={TALISU_ENGAGE.partnerImageAlt}
        imagePosition="center 18%"
        kicker={TALISU_ENGAGE.adviserKicker}
        title={TALISU_ENGAGE.adviserTitle}
      >
        <EngageSelection
          designs={designs}
          initialCodes={productCodes}
          bouncedReason={normalizeEngageLockReason(params.locked)}
        />
        <div className="mt-4 text-[13px] text-neutral-600" data-testid="talisu-engage-partner">
          <span className="font-semibold text-neutral-900">{TALISU_ENGAGE.partnerName}</span>
          {" · "}
          {TALISU_ENGAGE.landingRole}
        </div>
      </AdviserLayout>
    );
  }

  // Server side of the lock: a direct ?step=pay URL without at least one
  // valid design goes back to the landing with the reason (?locked=design);
  // the checkout is never loaded.
  const lockReason = engageLockReason(productCodes);
  if (lockReason) {
    redirect(engageLockedHref(lockReason));
  }

  const checkoutUrl = engageProductsCheckoutUrl(TALISU_ENGAGE.samcartUrl, products);

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
          {products.length ? (
            <div
              className="mb-4 rounded-2xl border border-[#046BD9]/25 bg-white px-4 py-3 text-sm text-neutral-800 shadow-sm sm:text-base"
              data-testid="engage-product"
              data-product-code={products[0].code}
              data-product-codes={productCodes.join(",")}
            >
              <span className="font-semibold text-[#046BD9]">
                {t.engageCustomizing}
              </span>{" "}
              {products.map((item, index) => (
                <span key={item.code}>
                  {index ? "; " : null}
                  <span className="font-semibold text-neutral-950">{item.code}</span>
                  {" — "}
                  {item.title}
                  <span className="text-neutral-500">
                    {" "}
                    · {fmt(t.engageCataloguePage, { page: item.cataloguePage })}
                  </span>
                </span>
              ))}{" "}
              <Link
                href={`/talisu/engage?${new URLSearchParams({ product: productCodes.join(",") }).toString().replace(/%2C/g, ",")}`}
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
