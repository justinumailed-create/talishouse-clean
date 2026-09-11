import MapSiteAdminEditor from "@/components/talispros-admin/MapSiteAdminEditor";
import MapSiteAdminMissing from "@/components/talispros-admin/MapSiteAdminMissing";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isMarketingManagerAuthenticated } from "@/lib/marketing-manager-auth";
import { requireTalisprosAdminPage } from "@/lib/talispros-admin-auth";
import { getMapSiteAdminWritesState } from "@/lib/supabaseAdmin";
import { getMapSiteByFastCodeResult } from "@/lib/mapsite-service";
import { hasCompletedMapSiteActivationPayment } from "@/lib/talispros/mapsite-payment";
import { getMapSiteEbookContext } from "@/lib/talisbooks/mapsite-ebook-service";
import { listAdminEbookPages } from "@/lib/talisbooks/admin-ebook-pages";

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
  const [paymentReceived, ebookContext] = await Promise.all([
    hasCompletedMapSiteActivationPayment({
      email: mapsite.email,
      mapsiteId: mapsite.id,
      fastCode: mapsite.fastCode,
      requestId: mapsite.requestId,
    }),
    getMapSiteEbookContext(mapsite.fastCode),
  ]);

  const ebookPages = ebookContext?.primaryEbook?.id
    ? await listAdminEbookPages(ebookContext.primaryEbook.id)
    : [];

  return (
    <MapSiteAdminEditor
      mapsite={mapsite}
      adminWritesEnabled={writesState.enabled}
      adminWritesMessage={writesState.message}
      backHref="/admin/mapsites"
      showVisitorSubscriptionPanel
      paymentReceived={paymentReceived}
      ebook={ebookContext?.primaryEbook ?? null}
      ebookPages={ebookPages}
    />
  );
}
