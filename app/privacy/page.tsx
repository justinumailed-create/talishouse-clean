import RalfLegalPage from "@/components/legal/RalfLegalPage";
import { RALF_PRIVACY } from "@/content/legal/ralf-privacy";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/privacy");
}

export default function PrivacyPage() {
  return <RalfLegalPage document={RALF_PRIVACY} />;
}
