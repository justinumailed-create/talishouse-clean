import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import MapSiteAdminEbookPanel from "@/components/talispros-admin/MapSiteAdminEbookPanel";
import OwnerReplaceImageTemplates from "@/components/talispros/ebook-editor/OwnerReplaceImageTemplates";
import { getReplaceImageGoogleSlidesCopyUrl } from "@/lib/talispros/replace-image-templates.server";
import { canEditMapSite } from "@/lib/mapsite-edit-auth";
import { CLIENT_LOGIN_PATH } from "@/lib/mapsite-account-session";
import { getMapSiteByFastCodeResult } from "@/lib/mapsite-service";
import { getMapSiteAdminWritesState } from "@/lib/supabaseAdmin";
import { resolveMapSiteLogoUrlForServer } from "@/lib/talispros/mapsite-branding-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create ebook · Talispros™",
  robots: { index: false, follow: false },
};

/** Ebook Editor → Create new: the same Build Talisbook™ / upload builder. */
export default async function OwnerEbookCreatePage({
  params,
}: {
  params: Promise<{ fastCode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { fastCode } = await params;
  if (!(await canEditMapSite(fastCode))) {
    redirect(CLIENT_LOGIN_PATH);
  }
  const { mapsite } = await getMapSiteByFastCodeResult(fastCode);
  if (!mapsite) notFound();

  const writes = getMapSiteAdminWritesState();
  const agencyLogoUrl = await resolveMapSiteLogoUrlForServer({
    mapsiteId: mapsite.id,
    fastCode: mapsite.fastCode,
    defaultLogoUrl: mapsite.logoUrl,
  });

  return (
    <div className="min-h-dvh bg-[#f5f5f7]">
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-6 sm:px-6">
        {/* Navigation via the blue TalisU navbar (TalisprosLayoutClient). */}
        <OwnerReplaceImageTemplates
          fastCode={mapsite.fastCode.toLowerCase()}
          googleSlidesCopyHref={getReplaceImageGoogleSlidesCopyUrl()}
        />
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
          initialAgencyLogoUrl={agencyLogoUrl}
        />
      </div>
    </div>
  );
}
