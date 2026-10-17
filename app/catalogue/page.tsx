import TopBoundFlipbook from "@/components/product-flipbook/TopBoundFlipbook";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadCataloguePages } from "@/lib/talisu/catalogue-pages";
import { pageMetadata } from "@/lib/seo/page-metadata";
import WorkingPageCtaLink, { WEBSTER_AVATAR_SRC } from "@/components/talispros/WorkingPageCtaLink";
import { ROUTES } from "@/lib/routes";

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
        // Ralf (Oct 17): "Plan your Project" with Webster → /talisu/engage.
        <WorkingPageCtaLink
          href={ROUTES.TALISU_ENGAGE}
          label={dict.catalogueUi.planProject}
          avatarSrc={WEBSTER_AVATAR_SRC}
          avatarAlt="Webster M."
          testId="catalogue-plan-project-link"
        />
      }
    />
  );
}
