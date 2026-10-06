import { createTalisUMetadata } from "@/lib/talisu/seo";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import TalisUMarketsMapApp from "@/components/talisu/TalisUMarketsMapApp";

export async function generateMetadata() {
  const locale = await getLocale();
  const m = getDictionary(locale).meta.talisuMarkets;
  return createTalisUMetadata({
    title: m.title,
    description: m.description,
    path: "/talisu/mkts",
    locale,
  });
}

/**
 * First-party Talismaps™ rebuild of the live Atlist Markets UI
 * (talisu.com/mkts). Flag pins + sidebar + Next Step… → /talisu/demo.
 */
export default function TalisUMarketsPage() {
  return <TalisUMarketsMapApp />;
}
