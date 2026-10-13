import Link from "next/link";
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
  const dict = getDictionary(await getLocale());
  const headline = dict.catalogueUi.headline;
  return (
    <TopBoundFlipbook
      pages={pages}
      title="Catalogue"
      showHeader={false}
      headline={headline}
      headlineAction={
        <Link
          href="/talisu/reg"
          data-testid="catalogue-register-link"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#046BD9]/40 bg-white px-4 py-1.5 text-[14px] font-semibold text-[#046BD9] shadow-sm transition hover:bg-[#046BD9] hover:text-white"
        >
          {dict.nav.mapsitesMenu.registerCatalogue}
          <span aria-hidden>→</span>
        </Link>
      }
    />
  );
}
