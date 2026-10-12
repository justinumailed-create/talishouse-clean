import { notFound } from "next/navigation";
import DemoEbookGenerateClient from "@/components/talispros/demo-mapsite/DemoEbookGenerateClient";
import { loadDemoMapSiteForEbook } from "@/lib/talispros/demo-mapsite-service";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talispros/demo-mapsite/ebook");
}

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DemoMapSiteEbookPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const mapsiteId = firstParam(params.mapsiteId)?.trim() || "";
  const mapsite = mapsiteId ? await loadDemoMapSiteForEbook(mapsiteId) : null;
  if (!mapsite) notFound();

  return (
    <DemoEbookGenerateClient
      mapsiteId={mapsite.mapsiteId}
      title={mapsite.title}
    />
  );
}
