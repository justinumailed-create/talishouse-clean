import TalisUTalisTvSoonPlaceholder from "@/components/talisu/TalisUTalisTvSoonPlaceholder";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talisu/au");
}

/** Audio library UI paused — restore by rendering the library component again. */
export default function TalisUAudioPage() {
  return <TalisUTalisTvSoonPlaceholder />;
}
