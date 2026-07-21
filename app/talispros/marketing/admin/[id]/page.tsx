import type { Metadata } from "next";
import { requireMarketingManagerPage } from "@/lib/marketing-manager-auth";
import { createMetadata } from "@/lib/seo";
import { MARKETING_ADMIN_PATH } from "@/lib/mapsite-account-session";
import MarketingAdminRequestDetail from "../MarketingAdminRequestDetail";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return createMetadata({
    title: "Registration Review | Marketing Manager | Talispros™",
    description: "Review a market registration and prepare MapSite onboarding.",
    path: `${MARKETING_ADMIN_PATH}/${id}`,
    private: true,
  });
}

export default async function MarketingAdminRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMarketingManagerPage();
  const { id } = await params;

  return <MarketingAdminRequestDetail requestId={id} />;
}
