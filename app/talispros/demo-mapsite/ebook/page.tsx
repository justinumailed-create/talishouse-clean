import { notFound } from "next/navigation";
import DemoEbookGenerateClient from "@/components/talispros/demo-mapsite/DemoEbookGenerateClient";
import { loadDemoMapSiteForEbook } from "@/lib/talispros/demo-mapsite-service";
import { personalHomePath } from "@/lib/talispros/personal-home";
import { isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { replaceImageTemplateAvailability } from "@/lib/talispros/replace-image-templates.server";

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
  const finished = firstParam(params.finish) === "1";
  const mapsite = mapsiteId ? await loadDemoMapSiteForEbook(mapsiteId) : null;
  if (!mapsite) {
    // Storage is off, so there is no saved demo to look up. Still show the
    // choice when the build step asked for it.
    if (finished && !isSupabaseAdminConfigured()) {
      const code = firstParam(params.code)?.trim() || "demo";
      return (
        <DemoEbookGenerateClient
          mapsiteId={mapsiteId}
          title="Demo Mapsite"
          fastCode={code}
          initialFinish
          keepHref="/"
        />
      );
    }
    notFound();
  }

  const next = firstParam(params.next)?.trim() || "";
  const keepHref =
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.includes("\\") &&
    !next.includes("://")
      ? next
      : personalHomePath(mapsite.code);

  return (
    <DemoEbookGenerateClient
      mapsiteId={mapsite.mapsiteId}
      title={mapsite.title}
      fastCode={mapsite.code}
      templateAvailability={replaceImageTemplateAvailability()}
      initialFinish={finished}
      keepHref={keepHref}
    />
  );
}
