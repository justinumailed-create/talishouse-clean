import Image from "next/image";
import Link from "next/link";
import { TALISU_ENGAGE } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import { TALISU_CARD } from "@/lib/talisu/ui";
import SectionShell from "@/components/talisu/SectionShell";
import SamCartEmbed from "@/components/talisu/SamCartEmbed";
import {
  CATALOGUE_PATH,
  catalogueProductCheckoutUrl,
  findCatalogueProduct,
} from "@/lib/talisu/catalogue-products";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | Engage the Team",
  description:
    "Send a down payment to engage Webster and the customization team for Glasshouse, Talishouse, Talistown, or Talisdome projects.",
  path: "/talisu/engage",
});

type TalisUEngagePageProps = {
  searchParams?: Promise<{ product?: string | string[] }>;
};

export default async function TalisUEngagePage({
  searchParams,
}: TalisUEngagePageProps) {
  const params = (await searchParams) ?? {};
  // Catalogue hotspots link here as ?product=P07. Unknown codes are ignored.
  const product = findCatalogueProduct(params.product);
  const checkoutUrl = catalogueProductCheckoutUrl(
    TALISU_ENGAGE.samcartUrl,
    product,
  );

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
              width={1024}
              height={1024}
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
          <p className="mt-3 text-sm text-neutral-700">
            {TALISU_ENGAGE.partnerIntro}
          </p>
          <ul className="mt-4 space-y-3 text-sm text-neutral-600">
            {TALISU_ENGAGE.bullets.map((b) => (
              <li key={b.label}>
                <span className="font-semibold text-neutral-900">{b.label}:</span>{" "}
                {b.text}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-medium text-[#0069CF]">
            {TALISU_ENGAGE.closing}
          </p>
        </div>

        <div className="min-w-0">
          {product ? (
            <div
              className="mb-4 rounded-2xl border border-[#046BD9]/25 bg-white px-4 py-3 text-sm text-neutral-800 shadow-sm sm:text-base"
              data-testid="engage-product"
              data-product-code={product.code}
            >
              <span className="font-semibold text-[#046BD9]">Customizing:</span>{" "}
              <span className="font-semibold text-neutral-950">{product.code}</span>
              {" — "}
              {product.title}
              <span className="text-neutral-500">
                {" "}
                · Talishouse™ Product Catalogue page {product.cataloguePage}
              </span>{" "}
              <Link
                href={CATALOGUE_PATH}
                className="whitespace-nowrap font-medium text-[#046BD9] hover:underline"
              >
                Change
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
