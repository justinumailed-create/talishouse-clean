import TalisUTalisTvSoonPlaceholder from "@/components/talisu/TalisUTalisTvSoonPlaceholder";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talisu/video");
}

/** Video hub UI paused — restore prior SectionShell content when ready. */
export default function TalisUVideoPage() {
  return <TalisUTalisTvSoonPlaceholder />;
}
