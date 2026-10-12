import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeaCanSku } from "@/lib/talisu/content";
import { TALISU_LINK } from "@/lib/talisu/ui";
import SectionShell from "@/components/talisu/SectionShell";
import SamCartEmbed from "@/components/talisu/SamCartEmbed";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talisu/bo/tsc20");
}

const SLUG = "tsc20";

export default function TalisUSkuCheckoutPage() {
  const product = getSeaCanSku(SLUG);
  if (!product) notFound();

  return (
    <SectionShell
      title={product.name}
      subtitle={`${product.dimensions} · ${product.blurb}`}
    >
      <div className="mb-4 text-center">
        <Link href="/talisu/bo" className={TALISU_LINK}>
          ← Back to Business Office
        </Link>
      </div>
      <SamCartEmbed
        src={product.samcartUrl}
        title={`${product.code} checkout — SamCart`}
        height={1200}
      />
    </SectionShell>
  );
}
