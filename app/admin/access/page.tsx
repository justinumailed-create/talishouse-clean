import { redirect } from "next/navigation";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { adminHomePath, isGlobalAdmin } from "@/lib/admin-constants";
import { listAdminGrantEvents, listAdminGrants } from "@/lib/admin-access-grants";
import { PageHeader } from "@/components/admin/ui";
import AdminAccessGrantsClient from "@/components/admin/AdminAccessGrantsClient";
import AdminRevokeSessionsButton from "@/components/admin/AdminRevokeSessionsButton";

export const dynamic = "force-dynamic";

/** Global Admin only: grant / edit / revoke admin access for other FAST Codes. */
export default async function AdminAccessPage() {
  const account = await getAdminSessionAccount();
  if (!account) redirect("/admin/login");
  if (!isGlobalAdmin(account)) redirect(adminHomePath(account));
  const [grants, events] = await Promise.all([listAdminGrants(), listAdminGrantEvents(40)]);
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Administration"
        title="Admin access"
        subtitle="You are the Global Admin. Grant other FAST Codes admin access and choose exactly which sections they can use. Only you can grant."
      />
      <AdminRevokeSessionsButton />
      <AdminAccessGrantsClient grants={grants} events={events} />
    </div>
  );
}
