import { redirect } from "next/navigation";
import MapSiteAdminEditor from "@/components/talispros-admin/MapSiteAdminEditor";
import MapSiteAdminMissing from "@/components/talispros-admin/MapSiteAdminMissing";
import { canEditMapSite } from "@/lib/mapsite-edit-auth";
import { CLIENT_LOGIN_PATH } from "@/lib/mapsite-account-session";
import { getMapSiteAdminWritesState } from "@/lib/supabaseAdmin";
import { getMapSiteByFastCodeResult } from "@/lib/mapsite-service";
import { getMapSiteEbookContext } from "@/lib/talisbooks/mapsite-ebook-service";
import { listAdminEbookPages } from "@/lib/talisbooks/admin-ebook-pages";
import { hasCompletedMapSitePaypalPayment } from "@/lib/talispros/mapsite-payment";

export const dynamic = "force-dynamic";

export default async function MapSiteOwnerEditPage({
  params,
}: {
  params: Promise<{ fastCode: string }>;
}) {
  const { fastCode } = await params;

  if (!(await canEditMapSite(fastCode))) {
    redirect(CLIENT_LOGIN_PATH);
  }

  const { mapsite, error } = await getMapSiteByFastCodeResult(fastCode);

  if (!mapsite) {
    return <MapSiteAdminMissing fastCode={fastCode} dbError={error} />;
  }

  const writesState = getMapSiteAdminWritesState();
  const [paymentReceived, ebookContext] = await Promise.all([
    hasCompletedMapSitePaypalPayment({
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
    <div className="min-h-screen bg-[#f5f5f7] p-6 sm:p-8">
      <MapSiteAdminEditor
        mapsite={mapsite}
        adminWritesEnabled={writesState.enabled}
        adminWritesMessage={writesState.message}
        backHref={`/talispros/mapsites/${fastCode}`}
        paymentReceived={paymentReceived}
        ebook={ebookContext?.primaryEbook ?? null}
        ebookPages={ebookPages}
      />
    </div>
  );
}
