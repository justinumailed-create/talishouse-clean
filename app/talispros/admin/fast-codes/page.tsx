import FastCodesPage from "@/app/admin/fast-codes/page";
import { requireTalisprosAdminPage } from "@/lib/talispros-admin-auth";

export const dynamic = "force-dynamic";

export default async function TalisprosAdminFastCodesPage() {
  await requireTalisprosAdminPage();
  return <FastCodesPage />;
}
