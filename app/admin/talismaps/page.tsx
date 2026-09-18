import { requireTalisprosAdminPage } from "@/lib/talispros-admin-auth";
import TalisMapsAdminHome from "@/components/admin/TalisMapsAdminHome";

export const dynamic = "force-dynamic";

export default async function TalisMapsAdminPage() {
  await requireTalisprosAdminPage();
  return <TalisMapsAdminHome />;
}
