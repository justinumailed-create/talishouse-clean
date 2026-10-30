import { requireMarketingManagerPage } from "@/lib/marketing-manager-auth";
import MarketingAdminDemosClient from "./MarketingAdminDemosClient";
import { adminMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return adminMetadata("Demo Mapsites");
}

export const dynamic = "force-dynamic";

export default async function MarketingAdminDemosPage() {
  await requireMarketingManagerPage();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Demo Mapsites</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Demonstration listings created from Build Demo eBook and Mapsite.
          They use the pinned Tsplits™ eBook and never receive a FAST Code.
        </p>
      </div>
      <MarketingAdminDemosClient />
    </div>
  );
}
