import { requireMarketingManagerPage } from "@/lib/marketing-manager-auth";
import MarketingAdminRequestDetail from "../MarketingAdminRequestDetail";
import { adminMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return adminMetadata("Registration Review");
}

export const dynamic = "force-dynamic";

export default async function MarketingAdminRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMarketingManagerPage();
  const { id } = await params;

  return <MarketingAdminRequestDetail requestId={id} />;
}
