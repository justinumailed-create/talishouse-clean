import { pageMetadata } from "@/lib/seo/page-metadata";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import LegalPage from "@/components/talisu/pmc/LegalPage";
import { normalizeFastCodeParam } from "@/lib/talispros/mapsite-contract";
import { TERMS_OF_SERVICE } from "@/lib/talisu/pmc-legal";

export async function generateMetadata() {
  return pageMetadata("/talisu/terms");
}

/** Terms of Service = PMC Service Agreement minus section 12 (Governing Law). */
export default async function PmcTermsPage({
  searchParams,
}: {
  searchParams?: Promise<{ fastCode?: string }>;
}) {
  const t = getDictionary(await getLocale()).pmc;
  const fastCode = normalizeFastCodeParam((await searchParams)?.fastCode);
  return (
    <LegalPage
      testId="pmc-terms"
      kicker="Tsplits™ · TalisALL PMC"
      title={t.terms}
      meta={["TalisALL PMC"]}
      sections={TERMS_OF_SERVICE}
      fastCode={fastCode}
    />
  );
}
