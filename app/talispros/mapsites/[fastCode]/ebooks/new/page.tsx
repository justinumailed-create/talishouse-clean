import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import MapSiteAdminEbookPanel from "@/components/talispros-admin/MapSiteAdminEbookPanel";
import { canEditMapSite } from "@/lib/mapsite-edit-auth";
import { CLIENT_LOGIN_PATH } from "@/lib/mapsite-account-session";
import { getMapSiteByFastCodeResult } from "@/lib/mapsite-service";
import { getMapSiteAdminWritesState } from "@/lib/supabaseAdmin";
import { safeMapSiteBackHref } from "@/lib/talispros/owner-ebook-routes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create ebook · Talispros™",
  robots: { index: false, follow: false },
};

/** Ebook Editor → Create new: the same Build Talisbook™ / upload builder. */
export default async function OwnerEbookCreatePage({
  params,
  searchParams,
}: {
  params: Promise<{ fastCode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { fastCode } = await params;
  const query = await searchParams;
  if (!(await canEditMapSite(fastCode))) {
    redirect(CLIENT_LOGIN_PATH);
  }
  const { mapsite } = await getMapSiteByFastCodeResult(fastCode);
  if (!mapsite) notFound();

  const back = Array.isArray(query.back) ? query.back[0] : query.back;
  const backHref = safeMapSiteBackHref(back, {
    fastCode: mapsite.fastCode,
    accountType: mapsite.accountType,
  });
  const writes = getMapSiteAdminWritesState();

  return (
    <div className="min-h-dvh bg-[#f5f5f7]">
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-6 sm:px-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#046BD9] hover:underline"
        >
          ← Back to Mapsite™
        </Link>
        <MapSiteAdminEbookPanel
          fastCode={mapsite.fastCode}
          mapsiteId={mapsite.id}
          requestId={mapsite.requestId}
          accountType={mapsite.accountType}
          initialEbook={null}
          adminWritesEnabled={writes.enabled}
          initialAgentName={
            mapsite.agentName ||
            `${mapsite.ownerFirstName} ${mapsite.ownerLastName}`.trim()
          }
          initialAgentEmail={mapsite.email}
          initialAgentPhone={mapsite.phone}
          pinLatitude={mapsite.latitude}
          pinLongitude={mapsite.longitude}
          initialPropertyAddress={mapsite.propertyAddress}
          initialListingTitle={mapsite.propertyTitle}
          initialPinWriteup={mapsite.propertyDescription}
          initialPriceLine={mapsite.price}
          initialAgencyLogoUrl={mapsite.logoUrl}
        />
      </div>
    </div>
  );
}
