import { requireMarketingManagerPage } from "@/lib/marketing-manager-auth";
import MarketingAdminQueue from "./MarketingAdminQueue";
import { adminMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return adminMetadata("Registrations");
}

export const dynamic = "force-dynamic";

export default async function MarketingAdminPage() {
  await requireMarketingManagerPage();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Market Registrations</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Review submissions from market pages, generate Mapsites, and send payment links.
        </p>
      </div>
      <MarketingAdminQueue />
    </div>
  );
}
