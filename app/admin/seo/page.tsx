import { requireAdminPage } from "@/lib/admin-auth";
import { listMapSitesForSeoAdmin } from "@/lib/mapsite-service";
import MapSiteSeoAdmin from "@/components/talispros-admin/MapSiteSeoAdmin";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  await requireAdminPage();
  const mapsites = await listMapSitesForSeoAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">SEO</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Meta title, description, and OpenGraph image for each Mapsite™, keyed
          by FAST Code. Empty fields show the live system-assigned share card.
        </p>
      </div>
      <MapSiteSeoAdmin mapsites={mapsites} />
    </div>
  );
}
