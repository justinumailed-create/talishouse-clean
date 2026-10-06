import type { Metadata } from "next";
import TopBoundFlipbook from "@/components/product-flipbook/TopBoundFlipbook";
import { createMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { talisprosBrandOgMetadataImage } from "@/lib/talispros/mapsite-og-image";
import { loadCataloguePages } from "@/lib/talisu/catalogue-pages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = getDictionary(locale).meta.catalogue;
  return createMetadata({
    title: m.title,
    description: m.description,
    path: "/catalogue",
    image: talisprosBrandOgMetadataImage(m.title),
    locale,
  });
}

/** Opens on Design Ideas; pages before it are trimmed in data (loadProductFlipbookPages startPage). */
export default async function CataloguePage() {
  const pages = loadCataloguePages();
  return (
    <TopBoundFlipbook
      pages={pages}
      title="Catalogue"
      showHeader={false}
    />
  );
}
