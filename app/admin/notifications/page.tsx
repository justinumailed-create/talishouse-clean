import { requireAdminPage } from "@/lib/admin-auth";
import { listAdminNotifications } from "@/lib/talispros/admin-notifications";
import AdminNotificationsPanel from "@/components/admin/AdminNotificationsPanel";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  await requireAdminPage();
  const { notifications, error } = await listAdminNotifications(100);

  return (
    <AdminNotificationsPanel
      initialNotifications={notifications}
      loadError={error ?? null}
    />
  );
}
