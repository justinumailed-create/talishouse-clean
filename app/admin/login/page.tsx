import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { adminHomePath } from "@/lib/admin-constants";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { getT } from "@/lib/i18n/server";
import { ADMIN_IDLE_LOGOUT_PARAM } from "@/lib/admin-idle";

export async function generateMetadata() {
  return pageMetadata("/admin/login");
}

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const account = await getAdminSessionAccount();
  if (account) {
    redirect(adminHomePath(account));
  }

  const params = await searchParams;
  const t = await getT();
  // Set by the admin idle logout (client timer or middleware idle cap).
  const notice = params[ADMIN_IDLE_LOGOUT_PARAM] === "1" ? t.adminIdle.signedOut : null;
  return <AdminLoginForm notice={notice} />;
}
