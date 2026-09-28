import type { Metadata } from "next";
import TopBoundFlipbook from "@/components/product-flipbook/TopBoundFlipbook";
import { loadProductFlipbookPages } from "@/lib/product-flipbook/load-pages";
import { createMetadata } from "@/lib/seo";
import { talisprosBrandOgMetadataImage } from "@/lib/talispros/mapsite-og-image";

const catalogueTitle = "T-All Catalogue | Talispros";

export const metadata: Metadata = createMetadata({
  title: catalogueTitle,
  description:
    "Top-bound T-All product catalogue. Pages turn one at a time from the top edge.",
  path: "/catalogue",
  image: talisprosBrandOgMetadataImage(catalogueTitle),
});

export default async function CataloguePage() {
  const pages = loadProductFlipbookPages();
  return <TopBoundFlipbook pages={pages} />;
}
