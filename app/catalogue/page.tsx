import TopBoundFlipbook from "@/components/product-flipbook/TopBoundFlipbook";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadCataloguePages } from "@/lib/talisu/catalogue-pages";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/catalogue");
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
