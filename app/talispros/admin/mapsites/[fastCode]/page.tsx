import MapSiteAdminEditor from "@/components/talispros-admin/MapSiteAdminEditor";
import MapSiteAdminMissing from "@/components/talispros-admin/MapSiteAdminMissing";
import { requireTalisprosAdminPage } from "@/lib/talispros-admin-auth";
import { isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { getMapSiteByFastCodeResult } from "@/lib/mapsite-service";

export const dynamic = "force-dynamic";

export default async function TalisprosAdminMapSitePage({
  params,
}: {
  params: Promise<{ fastCode: string }>;
}) {
  await requireTalisprosAdminPage();

  const { fastCode } = await params;
  const { mapsite, error } = await getMapSiteByFastCodeResult(fastCode);

  if (!mapsite) {
    return <MapSiteAdminMissing fastCode={fastCode} dbError={error} />;
  }

  return (
    <MapSiteAdminEditor
      mapsite={mapsite}
      adminWritesEnabled={isSupabaseAdminConfigured()}
    />
  );
}
