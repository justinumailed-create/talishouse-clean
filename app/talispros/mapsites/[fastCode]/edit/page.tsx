import MapSiteAdminEditor from "@/components/talispros-admin/MapSiteAdminEditor";
import MapSiteAdminMissing from "@/components/talispros-admin/MapSiteAdminMissing";
import MapSiteEditGate from "@/components/mapsite/MapSiteEditGate";
import { canEditMapSite } from "@/lib/mapsite-edit-auth";
import { isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { getMapSiteByFastCodeResult } from "@/lib/mapsite-service";

export const dynamic = "force-dynamic";

export default async function MapSiteOwnerEditPage({
  params,
}: {
  params: Promise<{ fastCode: string }>;
}) {
  const { fastCode } = await params;

  if (!(await canEditMapSite(fastCode))) {
    return <MapSiteEditGate fastCode={fastCode} />;
  }

  const { mapsite, error } = await getMapSiteByFastCodeResult(fastCode);

  if (!mapsite) {
    return <MapSiteAdminMissing fastCode={fastCode} dbError={error} />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-6 sm:p-8">
      <MapSiteAdminEditor
        mapsite={mapsite}
        adminWritesEnabled={isSupabaseAdminConfigured()}
        backHref={`/talispros/mapsites/${fastCode}`}
      />
    </div>
  );
}
