import type { Metadata } from "next";
import TopBoundFlipbook from "@/components/product-flipbook/TopBoundFlipbook";
import { createMetadata } from "@/lib/seo";
import { talisprosBrandOgMetadataImage } from "@/lib/talispros/mapsite-og-image";
import { loadCataloguePages } from "@/lib/talisu/catalogue-pages";

const catalogueTitle = "Catalogue | Talishouse™ Product Catalogue";

export const metadata: Metadata = createMetadata({
  title: catalogueTitle,
  description:
    "Talishouse™ Product Catalogue design ideas. Every design is numbered (P01, P02…) — tap one to register for that product.",
  path: "/catalogue",
  image: talisprosBrandOgMetadataImage(catalogueTitle),
});

/** Opens on Design Ideas; pages before it are trimmed in data (loadProductFlipbookPages startPage). */
export default async function CataloguePage() {
  const pages = loadCataloguePages();
  return (
    <TopBoundFlipbook
      pages={pages}
      eyebrow="Talishouse™ Product Catalogue"
      title="Catalogue"
      subtitle="Design ideas · tap a design to register for it"
    />
  );
}
