import RalfLegalPage from "@/components/legal/RalfLegalPage";
import { RALF_TERMS } from "@/content/legal/ralf-terms";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/terms");
}

export default function TermsPage() {
  return <RalfLegalPage document={RALF_TERMS} />;
}
