import MarketsMapOrGate from "@/components/talisu/MarketsMapOrGate";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const meta = await pageMetadata("/talisu/mkts");
  // Admin-only page: keep the EN/DE SEO + OG tags, but never index it.
  return { ...meta, robots: { index: false, follow: false } };
}

/**
 * First-party Talismaps™ rebuild of the live Atlist Markets UI
 * (talisu.com/mkts). Flag pins + sidebar + Next Step… → /talisu/demo.
 *
 * Signed-in admins see the map. Everyone else gets the Global Admin password
 * form; a correct password opens this map and an admin session.
 */
export default async function TalisUMarketsPage() {
  return <MarketsMapOrGate region="ca" />;
}
