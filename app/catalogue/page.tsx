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

/** Opens on the front cover; T-Dome is content page 1 (see loadCataloguePages). */
export default async function CataloguePage() {
  const pages = loadCataloguePages();
  const headline = getDictionary(await getLocale()).catalogueUi.headline;
  return (
    <TopBoundFlipbook
      pages={pages}
      title="Catalogue"
      showHeader={false}
      headline={headline}
    />
  );
}
