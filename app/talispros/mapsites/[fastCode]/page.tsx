import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MapSiteLayout from "@/components/mapsite/MapSiteLayout";
import { buildMapSiteLayoutData } from "@/lib/mapsite-layout";
import { getMapSiteVisitorAccountStatus } from "@/lib/mapsite-account-status";
import { getMapSiteEditToolbarState } from "@/lib/mapsite-edit-auth";
import { getPublicMapSiteByFastCode } from "@/lib/mapsite-service";

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

  if (!mapsite || mapsite.status !== "active") {
    notFound();
  }

  const layoutData = buildMapSiteLayoutData(mapsite);
  const [visitorStatus, editAccess] = await Promise.all([
    getMapSiteVisitorAccountStatus(),
    getMapSiteEditToolbarState(fastCode),
  ]);

  return (
    <MapSiteLayout
      data={layoutData}
      visitorHasSubscribed={visitorStatus.hasSubscribed}
      editAccess={editAccess}
    />
  );
}
