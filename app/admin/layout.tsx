import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { ADMIN_PATHNAME_HEADER } from "@/lib/admin-request-gate";
import { isProtectedAdminPath, isPublicAdminPath, isStandaloneAdminPath } from "@/lib/admin-paths";
import { accountCanAccessAdminPath } from "@/lib/admin-route-access";
import { adminHomePath } from "@/lib/admin-constants";
import { adminMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return adminMetadata();
}

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const account = await getAdminSessionAccount();
  const pathname = (await headers()).get(ADMIN_PATHNAME_HEADER) || "";

  if (isPublicAdminPath(pathname) && account) {
    redirect(adminHomePath(account));
  }

  // Agents on a temporary password must change it before using the console.
  if (account?.access === "agent" && account.mustChangePassword && isProtectedAdminPath(pathname)) {
    redirect("/agent/change-password");
  }

  if (isProtectedAdminPath(pathname) && !isStandaloneAdminPath(pathname)) {
    if (!account) {
      redirect("/admin/login");
    }
    if (!accountCanAccessAdminPath(account, pathname)) {
      redirect(adminHomePath(account));
    }
  }

  // Standalone /admin/talismaps also requires a hardcoded admin or a granted scope.
  if (isStandaloneAdminPath(pathname) && account && !accountCanAccessAdminPath(account, pathname)) {
    redirect(adminHomePath(account));
  }

  return <AdminLayoutClient serverAccount={account}>{children}</AdminLayoutClient>;
}
