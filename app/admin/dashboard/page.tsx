import { requireAdminPage } from "@/lib/admin-auth";
import TalisBooksAdminHome from "@/components/admin/TalisBooksAdminHome";
import TalisMapsAdminHome from "@/components/admin/TalisMapsAdminHome";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdminPage();

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Talisbooks™ and Talismaps™ platform administration.
        </p>
      </div>
      <TalisBooksAdminHome />
      <TalisMapsAdminHome />
    </div>
  );
}
