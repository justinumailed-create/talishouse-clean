import FormsManagerPage from "@/components/talispros-admin/FormsManagerPage";
import { requireAdminPathAccess } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminFormsManagerPage() {
  await requireAdminPathAccess("/admin/forms-manager");
  return <FormsManagerPage />;
}
