import { requireTalisprosAdminPage } from "@/lib/talispros-admin-auth";
import TalisBooksAdminHome from "@/components/admin/TalisBooksAdminHome";

export const dynamic = "force-dynamic";

export default async function TalisBooksAdminPage() {
  await requireTalisprosAdminPage();
  return <TalisBooksAdminHome />;
}
