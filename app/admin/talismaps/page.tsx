import { requireAdminPage } from "@/lib/admin-auth";
import TalisMapsAdminHome from "@/components/admin/TalisMapsAdminHome";

export const dynamic = "force-dynamic";

export default async function TalisMapsAdminPage() {
  await requireAdminPage();
  return <TalisMapsAdminHome />;
}
