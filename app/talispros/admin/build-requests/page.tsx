import { redirect } from "next/navigation";
import { requireTalisprosAdminPage } from "@/lib/talispros-admin-auth";

export const dynamic = "force-dynamic";

export default async function TalisprosAdminBuildRequestsRedirectPage() {
  await requireTalisprosAdminPage();
  redirect("/talispros/admin/forms-manager");
}
