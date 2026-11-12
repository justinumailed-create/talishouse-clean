import PublicLegalPage from "@/components/legal/PublicLegalPage";
import { privacyDocument } from "@/content/legal/privacy";
import { getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/privacy");
}

export default async function PrivacyPage() {
  const doc = privacyDocument(await getLocale());
  return (
    <PublicLegalPage
      testId="privacy-page"
      kicker={doc.kicker}
      title={doc.title}
      meta={doc.meta}
      sections={doc.sections}
    />
  );
}
