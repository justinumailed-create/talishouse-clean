import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { ADMIN_PATHNAME_HEADER } from "@/lib/admin-request-gate";
import { isProtectedAdminPath, isPublicAdminPath, isStandaloneAdminPath } from "@/lib/admin-paths";
import { accountCanAccessAdminPath } from "@/lib/admin-route-access";
import { ADMIN_CONSOLE_METADATA } from "@/lib/admin-seo";

export const metadata: Metadata = ADMIN_CONSOLE_METADATA;
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const account = await getAdminSessionAccount();
  const pathname = (await headers()).get(ADMIN_PATHNAME_HEADER) || "";

  if (isPublicAdminPath(pathname) && account) {
    redirect("/admin/dashboard");
  }

  if (isProtectedAdminPath(pathname) && !isStandaloneAdminPath(pathname)) {
    if (!account) {
      redirect("/admin/login");
    }
    if (!accountCanAccessAdminPath(account, pathname)) {
      redirect("/admin/dashboard");
    }
  }

  return <AdminLayoutClient serverAccount={account}>{children}</AdminLayoutClient>;
}
