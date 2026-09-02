import type { Metadata } from "next";
import { requireMarketingManagerPage } from "@/lib/marketing-manager-auth";
import { createMetadata } from "@/lib/seo";
import { MARKETING_ADMIN_DEMOS_PATH } from "@/lib/mapsite-account-session";
import MarketingAdminDemosClient from "./MarketingAdminDemosClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createMetadata({
  title: "Demo Mapsites™ | Marketing Manager | Talispros™",
  description:
    "Edit or delete demonstration Mapsites™ that use the pinned Talispros eBook.",
  path: MARKETING_ADMIN_DEMOS_PATH,
  private: true,
});

export default async function MarketingAdminDemosPage() {
  await requireMarketingManagerPage();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Demo Mapsites™</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Demonstration listings created from Build Demo eBook and Mapsite™.
          They use the pinned Talispros eBook and never receive a FAST Code.
        </p>
      </div>
      <MarketingAdminDemosClient />
    </div>
  );
}
