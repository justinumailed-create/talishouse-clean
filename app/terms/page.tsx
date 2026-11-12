import PublicLegalPage from "@/components/legal/PublicLegalPage";
import { termsDocument } from "@/content/legal/terms";
import { getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/terms");
}

export default async function TermsPage() {
  const doc = termsDocument(await getLocale());
  return (
    <PublicLegalPage
      testId="terms-page"
      kicker={doc.kicker}
      title={doc.title}
      meta={doc.meta}
      sections={doc.sections}
    />
  );
}
