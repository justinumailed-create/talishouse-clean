import type { Metadata } from "next";
import Link from "next/link";
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
    <div className="min-h-dvh bg-white px-5 py-10 text-neutral-900">
      <div className="mx-auto w-full max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Demonstration
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Create the demo Talisbook™
        </h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Extract the pinned Talispros eBook PDF, then rasterize and optimize
          each page the same way live generation does. When that finishes, we
          open your demo Mapsite™.
        </p>
        <p className="mt-3 text-sm">
          <Link
            href={DEMO_MAPSITE_BUILD_PATH}
            className="text-neutral-700 underline underline-offset-2"
          >
            Back to pin placement
          </Link>
        </p>
        <div className="mt-8">
          <DemoEbookGenerateClient
            mapsiteId={mapsite.mapsiteId}
            title={mapsite.title}
          />
        </div>
      </div>
    </div>
  );
}
