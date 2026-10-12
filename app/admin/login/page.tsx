import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { adminHomePath } from "@/lib/admin-constants";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const account = await getAdminSessionAccount();
  if (account) {
    redirect(adminHomePath(account));
  }

  return <AdminLoginForm />;
}
