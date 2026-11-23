import MarketsAdminGate from "@/components/talisu/MarketsAdminGate";
import MarketsMapsitesMap from "@/components/talisu/MarketsMapsitesMap";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { listMarketsMapsitePins } from "@/lib/talisu/markets-mapsites.server";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const meta = await pageMetadata("/markets/mapsites");
  // Admin-only page: never index it.
  return { ...meta, robots: { index: false, follow: false } };
}

/**
 * Markets → Mapsites Built (Ralf, Nov 23): every built Mapsite as a PIN, so
 * success shows at a glance. A PIN opens its account and CRM / CSV record.
 * Gated like the USA and Canada Markets maps.
 */
export default async function MarketsMapsitesPage() {
  const account = await getAdminSessionAccount();
  if (!account) return <MarketsAdminGate />;
  const pins = await listMarketsMapsitePins();
  return <MarketsMapsitesMap pins={pins} />;
}
