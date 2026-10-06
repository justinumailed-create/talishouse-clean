import { createTalisUMetadata } from "@/lib/talisu/seo";
import TalisUTalisTvSoonPlaceholder from "@/components/talisu/TalisUTalisTvSoonPlaceholder";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | Audio",
  description:
    "Listen to TalisU™ audio — a short welcome autoplays, plus Aisha & Webster on digital property fractionalization.",
  path: "/talisu/au",
});

/** Audio library UI paused — restore by rendering the library component again. */
export default function TalisUAudioPage() {
  return <TalisUTalisTvSoonPlaceholder />;
}
