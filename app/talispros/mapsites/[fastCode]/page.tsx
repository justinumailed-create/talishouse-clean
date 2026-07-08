import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MapSiteLayout from "@/components/mapsite/MapSiteLayout";
import { buildMapSiteLayoutData } from "@/lib/mapsite-layout";
import { getMapSiteVisitorAccountStatus } from "@/lib/mapsite-account-status";
import { getMapSiteEditToolbarState } from "@/lib/mapsite-edit-auth";
import { getPublicMapSiteByFastCode } from "@/lib/mapsite-service";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ fastCode: string }>;
}): Promise<Metadata> {
  const { fastCode } = await params;
  const mapsite = await getPublicMapSiteByFastCode(fastCode);

  if (!mapsite) {
    return { title: "MapSite Not Found | Talispros™" };
  }

  const layoutData = buildMapSiteLayoutData(mapsite);

  return {
    title: layoutData.metaTitle || `${layoutData.propertyTitle} | MapSite™`,
    description:
      layoutData.metaDescription ||
      layoutData.summary.description ||
      `MapSite™ ${layoutData.fastCode}`,
    openGraph: layoutData.ogImageUrl
      ? {
          images: [{ url: layoutData.ogImageUrl }],
        }
      : undefined,
  };
}

export default async function TalisprosMapSitePage({
  params,
}: {
  params: Promise<{ fastCode: string }>;
}) {
  const { fastCode } = await params;
  const mapsite = await getPublicMapSiteByFastCode(fastCode);

  if (!mapsite || (mapsite.status !== "active" && mapsite.status !== "draft")) {
    notFound();
  }

  const layoutData = buildMapSiteLayoutData(mapsite);
  const [visitorStatus, editAccess, buildRequestLink] = await Promise.all([
    getMapSiteVisitorAccountStatus(),
    getMapSiteEditToolbarState(fastCode),
    getSupabaseAdmin()
      .from("build_requests")
      .select("id")
      .or(`linked_mapsite_id.eq.${mapsite.id},requested_fast_code.eq.${mapsite.fastCode}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <MapSiteLayout
      data={layoutData}
      visitorHasSubscribed={visitorStatus.hasSubscribed}
      visitorFastCode={visitorStatus.fastCode}
      editAccess={editAccess}
      buildRequestId={buildRequestLink.data?.id}
    />
  );
}
