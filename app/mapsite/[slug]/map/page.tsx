import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import MapSiteTalisMaps from "@/components/mapsite/MapSiteTalisMaps";
import {
  loadPublishedMapSiteView,
} from "@/components/mapsite/PublishedMapSiteView";
import { buildMapSiteLayoutData } from "@/lib/mapsite-layout";
import { createMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";


interface MapSiteFullscreenMapPageProps {
  params: Promise<{ slug?: string }>;
}

export async function generateMetadata({
  params,
}: MapSiteFullscreenMapPageProps): Promise<Metadata> {
  const { slug } = await params;
  const code = slug?.toLowerCase().trim() || "";
  if (!code) {
    return { title: "Mapsite™ map" };
  }
  const published = await loadPublishedMapSiteView(code);
  const title = published?.propertyTitle?.trim() || code.toUpperCase();
  return createMetadata({
    title: `${title} map | Mapsite™`,
    description: `Full-screen Mapsite™ map and PIN for ${title}.`,
    path: `/mapsite/${code}/map`,
    image: false,
  });
}

export default async function MapSiteFullscreenMapPage({
  params,
}: MapSiteFullscreenMapPageProps) {
  await connection();
  const { slug } = await params;
  const code = slug?.toLowerCase().trim() || "";
  if (!code) notFound();

  const published = await loadPublishedMapSiteView(code);
  if (!published) notFound();

  const layout = buildMapSiteLayoutData(published);

  return (
    <MapSiteTalisMaps
      pins={layout.pins}
      mapCenter={layout.mapCenter}
      mapZoom={layout.mapZoom}
      propertyTitle={layout.propertyTitle}
      fastCode={code}
      variant="window"
      backHref={`/mapsite/${encodeURIComponent(code)}`}
    />
  );
}
