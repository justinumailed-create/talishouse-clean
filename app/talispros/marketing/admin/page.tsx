import type { Metadata } from "next";
import { requireMarketingManagerPage } from "@/lib/marketing-manager-auth";
import { createMetadata } from "@/lib/seo";
import { MARKETING_ADMIN_PATH } from "@/lib/mapsite-account-session";
import MarketingAdminQueue from "./MarketingAdminQueue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createMetadata({
  title: "Registrations | Marketing Manager | Talispros™",
  description:
    "Review market registrations, create MapSites™, and send payment links.",
  path: MARKETING_ADMIN_PATH,
  private: true,
});

export default async function MarketingAdminPage() {
  await requireMarketingManagerPage();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Market Registrations</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Review submissions from market pages, generate MapSites™, and send payment links.
        </p>
      </div>
      <MarketingAdminQueue />
    </div>
  );
}
