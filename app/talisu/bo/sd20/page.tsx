import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeaCanSku, SEA_CAN_TAGLINE } from "@/lib/talisu/content";
import { createTalisUMetadata } from "@/lib/talisu/seo";
import SectionShell from "@/components/talisu/SectionShell";
import SamCartEmbed from "@/components/talisu/SamCartEmbed";

const SLUG = "sd20";
const sku = getSeaCanSku(SLUG);

export const metadata = createTalisUMetadata({
  title: sku
    ? `TalisU Sea-Cans | ${sku.code}`
    : "TalisU Sea-Cans",
  description: sku
    ? `${sku.name} — ${sku.dimensions}. ${SEA_CAN_TAGLINE}`
    : SEA_CAN_TAGLINE,
  path: `/talisu/bo/${SLUG}`,
});

export default function TalisUSkuCheckoutPage() {
  const product = getSeaCanSku(SLUG);
  if (!product) notFound();

  return (
    <SectionShell
      title={product.name}
      subtitle={`${product.dimensions} · ${product.blurb}`}
    >
      <div className="mb-4 text-center">
        <Link
          href="/talisu/bo"
          className="text-sm text-amber-200/80 hover:text-amber-100"
        >
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
