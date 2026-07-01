import FormsManagerPage from "@/components/talispros-admin/FormsManagerPage";
import { requireTalisprosAdminPage } from "@/lib/talispros-admin-auth";

export const dynamic = "force-dynamic";

export default async function TalisprosAdminFormsManagerPage() {
  await requireTalisprosAdminPage();
  return <FormsManagerPage />;
}
