import { pageMetadata } from "@/lib/seo/page-metadata";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import LegalPage from "@/components/talisu/pmc/LegalPage";
import { normalizeFastCodeParam } from "@/lib/talispros/mapsite-contract";
import { PRIVACY_POLICY, PRIVACY_POLICY_META } from "@/lib/talisu/pmc-legal";

export async function generateMetadata() {
  return pageMetadata("/talisu/privacy");
}

export default async function PmcPrivacyPage({
  searchParams,
}: {
  searchParams?: Promise<{ fastCode?: string }>;
}) {
  const t = getDictionary(await getLocale()).pmc;
  const fastCode = normalizeFastCodeParam((await searchParams)?.fastCode);
  return (
    <LegalPage
      testId="pmc-privacy"
      kicker="TalisALL"
      title={t.privacy}
      meta={[
        `Effective Date: ${PRIVACY_POLICY_META.effectiveDate}`,
        `Company: ${PRIVACY_POLICY_META.company}`,
        `Website: ${PRIVACY_POLICY_META.websites}`,
      ]}
      sections={PRIVACY_POLICY}
      fastCode={fastCode}
    />
  );
}
