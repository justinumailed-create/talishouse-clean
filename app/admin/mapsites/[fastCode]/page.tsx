import MapSiteAdminEditor from "@/components/talispros-admin/MapSiteAdminEditor";
import MapSiteAdminMissing from "@/components/talispros-admin/MapSiteAdminMissing";
import { getAdminSessionAccount, isAdminAuthenticated } from "@/lib/admin-auth";
import { accountHasAdminScope } from "@/lib/admin-constants";
import AdminFreePinCreditsPanel from "@/components/admin/AdminFreePinCreditsPanel";
import {
  listFreePinGrants,
  loadFreePinAdminSnapshot,
} from "@/lib/talispros/mapsite-additional-pins-service";
import { isMarketingManagerAuthenticated } from "@/lib/marketing-manager-auth";
import { requireTalisprosAdminPage } from "@/lib/talispros-admin-auth";
import { getMapSiteAdminWritesState } from "@/lib/supabaseAdmin";
import { getMapSiteByFastCodeResult } from "@/lib/mapsite-service";
import { hasCompletedMapSiteActivationPayment } from "@/lib/talispros/mapsite-payment";
import { getMapSiteEbookContext } from "@/lib/talisbooks/mapsite-ebook-service";

export const dynamic = "force-dynamic";

async function requireAdminMapSiteEditor() {
  if (await isMarketingManagerAuthenticated()) return;
  if (await isAdminAuthenticated()) return;
  await requireTalisprosAdminPage();
}

export default async function AdminMapSiteEditorPage({
  params,
}: {
  params: Promise<{ fastCode: string }>;
}) {
  await requireAdminMapSiteEditor();

  const { fastCode } = await params;
  const { mapsite, error } = await getMapSiteByFastCodeResult(fastCode);

  if (!mapsite) {
    return <MapSiteAdminMissing fastCode={fastCode} dbError={error} />;
  }

  const writesState = getMapSiteAdminWritesState();
  const adminAccount = await getAdminSessionAccount();
  const canGrantFreePins = accountHasAdminScope(adminAccount, "mapsites");
  const [paymentReceived, ebookContext, freePinSnapshot, freePinGrants] = await Promise.all([
    hasCompletedMapSiteActivationPayment({
      email: mapsite.email,
      mapsiteId: mapsite.id,
      fastCode: mapsite.fastCode,
      requestId: mapsite.requestId,
    }),
    getMapSiteEbookContext(mapsite.fastCode, { includeRm22Editor: true }),
    canGrantFreePins ? loadFreePinAdminSnapshot(mapsite.fastCode) : Promise.resolve(null),
    canGrantFreePins
      ? listFreePinGrants({ mapsiteId: mapsite.id, limit: 20 })
      : Promise.resolve([]),
  ]);

  return (
    <MapSiteAdminEditor
      mapsite={mapsite}
      adminWritesEnabled={writesState.enabled}
      adminWritesMessage={writesState.message}
      backHref="/admin/mapsites"
      showVisitorSubscriptionPanel
      paymentReceived={paymentReceived}
      ebook={ebookContext?.primaryEbook ?? null}
      extraPanels={
        canGrantFreePins ? (
          <AdminFreePinCreditsPanel
            fastCode={mapsite.fastCode}
            lockFastCode
            initialSnapshot={freePinSnapshot}
            initialGrants={freePinGrants}
            disabled={!writesState.enabled}
          />
        ) : null
      }
    />
  );
}
