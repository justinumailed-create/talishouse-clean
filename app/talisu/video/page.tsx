import { createTalisUMetadata } from "@/lib/talisu/seo";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import TalisUTalisTvSoonPlaceholder from "@/components/talisu/TalisUTalisTvSoonPlaceholder";

export async function generateMetadata() {
  const locale = await getLocale();
  const m = getDictionary(locale).meta.talisuVideo;
  return createTalisUMetadata({
    title: m.title,
    description: m.description,
    path: "/talisu/video",
    locale,
  });
}

/** Video hub UI paused — restore prior SectionShell content when ready. */
export default function TalisUVideoPage() {
  return <TalisUTalisTvSoonPlaceholder />;
}
