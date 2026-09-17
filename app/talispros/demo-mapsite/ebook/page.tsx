import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createMetadata } from "@/lib/seo";
import DemoEbookGenerateClient from "@/components/talispros/demo-mapsite/DemoEbookGenerateClient";
import { loadDemoMapSiteForEbook } from "@/lib/talispros/demo-mapsite-service";
import { DEMO_MAPSITE_BUILD_PATH } from "@/lib/talispros/demo-mapsite";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const metadata: Metadata = createMetadata({
  title: "Demo Talisbook™ | Talispros™",
  description:
    "Extract the pinned Talispros eBook PDF, optimize its pages, and generate a demonstration Talisbook™.",
  path: `${DEMO_MAPSITE_BUILD_PATH}/ebook`,
  image: false,
});

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
