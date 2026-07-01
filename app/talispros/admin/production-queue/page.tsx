import ProductionQueuePage from "@/app/admin/production-queue/page";
import { requireTalisprosAdminPage } from "@/lib/talispros-admin-auth";

export const dynamic = "force-dynamic";

export default async function TalisprosAdminProductionQueuePage() {
  await requireTalisprosAdminPage();
  return <ProductionQueuePage />;
}
