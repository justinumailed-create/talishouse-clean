import { redirect } from "next/navigation";
import TalisUMarketsMapApp from "@/components/talisu/TalisUMarketsMapApp";
import { getAdminSessionAccount } from "@/lib/admin-auth";
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
 * Admin-only: signed-in admins (Global Admin, granted admins, Agent Admins)
 * see the map; everyone else is redirected Home. ALLPINS / Mapsite redirects
 * still point here, so admins keep the same entry points.
 */
export default async function TalisUMarketsPage() {
  const account = await getAdminSessionAccount();
  if (!account) redirect("/");
  return <TalisUMarketsMapApp />;
}
