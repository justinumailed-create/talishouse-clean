import MapSiteAdminEditor from "@/components/talispros-admin/MapSiteAdminEditor";
import MapSiteAdminMissing from "@/components/talispros-admin/MapSiteAdminMissing";
import { requireTalisprosAdminPage } from "@/lib/talispros-admin-auth";
import { isMarketingManagerAuthenticated } from "@/lib/marketing-manager-auth";
import { getMapSiteAdminWritesState } from "@/lib/supabaseAdmin";
import { getMapSiteByFastCodeResult } from "@/lib/mapsite-service";

export const dynamic = "force-dynamic";

async function requirePmcMapSiteEditor() {
  if (await isMarketingManagerAuthenticated()) return;
  await requireTalisprosAdminPage();
}

export default async function TalisprosAdminMapSitePage({
  params,
}: {
  params: Promise<{ fastCode: string }>;
}) {
  await requirePmcMapSiteEditor();

  const { fastCode } = await params;
  const { mapsite, error } = await getMapSiteByFastCodeResult(fastCode);

  if (!mapsite) {
    return <MapSiteAdminMissing fastCode={fastCode} dbError={error} />;
  }

  const writesState = getMapSiteAdminWritesState();

  return (
    <MapSiteAdminEditor
      mapsite={mapsite}
      adminWritesEnabled={writesState.enabled}
      adminWritesMessage={writesState.message}
      backHref="/talispros/admin/pmc"
      showVisitorSubscriptionPanel
    />
  );
}
