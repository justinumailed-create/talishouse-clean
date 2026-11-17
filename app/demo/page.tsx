import DemoMapSiteBuilderClient from "@/components/talispros/demo-mapsite/DemoMapSiteBuilderClient";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { demoBuilderStartsOpen, demoInitialPinFromParams } from "@/lib/talispros/demo-builder";

export async function generateMetadata() {
  return pageMetadata("/demo");
}

export const dynamic = "force-dynamic";

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <DemoMapSiteBuilderClient
      initialOpen={demoBuilderStartsOpen(params)}
      initialPin={demoInitialPinFromParams(params)}
    />
  );
}
