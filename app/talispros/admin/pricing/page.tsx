import PricingAdminPage from "@/app/admin/pricing/page";
import { requireTalisprosAdminPage } from "@/lib/talispros-admin-auth";

export const dynamic = "force-dynamic";

export default async function TalisprosAdminPricingPage() {
  await requireTalisprosAdminPage();
  return <PricingAdminPage />;
}
