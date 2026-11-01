import { redirect } from "next/navigation";
import TalisUMarketsMapApp from "@/components/talisu/TalisUMarketsMapApp";
import { getAdminSessionAccount } from "@/lib/admin-auth";
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
 * Gated exactly like Canada Markets: signed-in admins (Global Admin, granted
 * admins, Agent Admins) see the map; everyone else is redirected Home.
 */
export default async function TalisUUsMarketsPage() {
  const account = await getAdminSessionAccount();
  if (!account) redirect("/");
  return <TalisUMarketsMapApp region="us" />;
}
