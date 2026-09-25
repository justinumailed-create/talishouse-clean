import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import MapSiteTalisMaps from "@/components/mapsite/MapSiteTalisMaps";
import {
  loadPublishedMapSiteView,
} from "@/components/mapsite/PublishedMapSiteView";
import { buildMapSiteLayoutData } from "@/lib/mapsite-layout";
import { createMetadata } from "@/lib/seo";
import {
  allpinsSeoCopy,
  mapsiteOgMetadataImage,
  mapsiteRealtimeSeoCopy,
  resolveMapSiteOgImage,
} from "@/lib/talispros/mapsite-og-image";
import { isAllPinsFastCode } from "@/lib/talispros/allpins-mapsite-constants";
import { mapsiteBackFromScheduleHref } from "@/lib/talispros/mapsite-state";

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
  const ogImage = resolveMapSiteOgImage(code);

  if (isAllPinsFastCode(code)) {
    const copy = allpinsSeoCopy();
    return createMetadata({
      title: copy.title.replace(" | Mapsite™", " map | Mapsite™"),
      description: copy.description,
      path: `/mapsite/${code}/map`,
      image: mapsiteOgMetadataImage(ogImage, copy.title),
    });
  }

  const live = mapsiteRealtimeSeoCopy({
    fastCode: code,
    propertyTitle: published?.propertyTitle,
    propertyDescription: published?.propertyDescription,
    propertyAddress: published?.propertyAddress,
  });
  const baseTitle = published?.metaTitle?.trim() || live.title;
  const title = baseTitle.includes(" map | ")
    ? baseTitle
    : baseTitle.replace(" | Mapsite™", " map | Mapsite™");
  const description =
    published?.metaDescription?.trim() ||
    live.description ||
    `Full-screen Mapsite™ map and PIN for ${baseTitle}.`;
  return createMetadata({
    title,
    description,
    path: `/mapsite/${code}/map`,
    image: mapsiteOgMetadataImage(ogImage, baseTitle),
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
      pinLabel={layout.pinLabel}
      fastCode={code}
      variant="window"
      backHref={mapsiteBackFromScheduleHref(code)}
    />
  );
}
