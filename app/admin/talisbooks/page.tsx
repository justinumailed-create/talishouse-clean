import { requireAdminScopePage } from "@/lib/admin-auth";
import TalisBooksAdminHome from "@/components/admin/TalisBooksAdminHome";

export const dynamic = "force-dynamic";

export default async function TalisBooksAdminPage() {
  await requireAdminScopePage("talisbooks");
  return <TalisBooksAdminHome />;
}
