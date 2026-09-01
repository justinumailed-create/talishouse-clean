import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PublishedMapSiteView, {
  loadPublishedMapSiteView,
  publishedMapSiteMetadata,
} from "@/components/mapsite/PublishedMapSiteView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ fastCode: string }>;
}): Promise<Metadata> {
  const { fastCode } = await params;
  const mapsite = await loadPublishedMapSiteView(fastCode);

  if (!mapsite) {
    return { title: "Mapsite™ Not Found | Talispros™" };
  }

  return publishedMapSiteMetadata(mapsite);
}

export default async function TalisprosMapSitePage({
  params,
}: {
  params: Promise<{ fastCode: string }>;
}) {
  const { fastCode } = await params;
  const mapsite = await loadPublishedMapSiteView(fastCode);

  if (!mapsite) {
    notFound();
  }

  return <PublishedMapSiteView mapsite={mapsite} />;
}
