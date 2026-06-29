import { notFound } from "next/navigation";
import MapSiteAdminEditor from "@/components/admin/MapSiteAdminEditor";
import { requireAdminPage } from "@/lib/admin-auth";
import { getMapSiteByFastCode } from "@/lib/mapsite-service";

export const dynamic = "force-dynamic";

export default async function AdminMapSitePage({
  params,
}: {
  params: Promise<{ fastCode: string }>;
}) {
  await requireAdminPage();

  const { fastCode } = await params;
  const mapsite = await getMapSiteByFastCode(fastCode);

  if (!mapsite) {
    notFound();
  }

  return <MapSiteAdminEditor mapsite={mapsite} />;
}
