import RegistrationsPage from "@/app/admin/registrations/page";
import { requireTalisprosAdminPage } from "@/lib/talispros-admin-auth";

export const dynamic = "force-dynamic";

export default async function TalisprosAdminRegistrationsPage() {
  await requireTalisprosAdminPage();
  return <RegistrationsPage />;
}
