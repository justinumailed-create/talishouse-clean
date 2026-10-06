import { createTalisUMetadata } from "@/lib/talisu/seo";
import TalisUTalisTvSoonPlaceholder from "@/components/talisu/TalisUTalisTvSoonPlaceholder";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | Video",
  description: "TalisU™ video library and TalisTV™ programming.",
  path: "/talisu/video",
});

/** Video hub UI paused — restore prior SectionShell content when ready. */
export default function TalisUVideoPage() {
  return <TalisUTalisTvSoonPlaceholder />;
}
