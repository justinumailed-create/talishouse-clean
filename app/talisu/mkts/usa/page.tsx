import MarketsMapOrGate from "@/components/talisu/MarketsMapOrGate";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const meta = await pageMetadata("/talisu/mkts/usa");
  // Admin-only page: keep the EN/DE SEO + OG tags, but never index it.
  return { ...meta, robots: { index: false, follow: false } };
}

/**
 * USA Markets: native Talismaps™ map of the 30 US market PINs (US-flag pins),
 * same look, sidebar and Next Step… flow as Canada Markets (/talisu/mkts).
 * No redirect or link to Taliswebs.
 *
 * Gated exactly like Canada Markets: signed-in admins see the map; everyone
 * else enters the existing Global Admin password, which also opens admin access.
 */
export default async function TalisUUsMarketsPage() {
  return <MarketsMapOrGate region="us" />;
}
