import { requireAdminPage } from "@/lib/admin-auth";
import { listMapSitesForAdmin } from "@/lib/mapsite-service";
import AdminMapSiteThumbnailCard from "@/components/admin/AdminMapSiteThumbnailCard";
import { isSupabaseAdminConfigured, getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { purgeMapSitesAndBookshelvesWithoutFastCodes } from "@/lib/talispros/fast-code-cascade-delete";

export const dynamic = "force-dynamic";

export default async function AdminMapSitesPage() {
  await requireAdminPage();
  if (isSupabaseAdminConfigured()) {
    await purgeMapSitesAndBookshelvesWithoutFastCodes(getSupabaseAdmin());
  }
  const mapsites = await listMapSitesForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Mapsites™</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Open a Mapsite™ to edit listing text, media, pin placement, lifecycle,
          and the custom ebook editor (Front Cover / Back Cover, interiors, publish).
        </p>
      </div>

      {mapsites.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
          No Mapsites™ found. New submissions appear here after a build request is generated.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mapsites.map((mapsite) => (
            <AdminMapSiteThumbnailCard
              key={mapsite.id || mapsite.fastCode}
              mapsite={mapsite}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
