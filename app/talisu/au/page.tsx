import { createTalisUMetadata } from "@/lib/talisu/seo";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import TalisUTalisTvSoonPlaceholder from "@/components/talisu/TalisUTalisTvSoonPlaceholder";

export async function generateMetadata() {
  const locale = await getLocale();
  const m = getDictionary(locale).meta.talisuAudio;
  return createTalisUMetadata({
    title: m.title,
    description: m.description,
    path: "/talisu/au",
    locale,
  });
}

/** Audio library UI paused — restore by rendering the library component again. */
export default function TalisUAudioPage() {
  return <TalisUTalisTvSoonPlaceholder />;
}
