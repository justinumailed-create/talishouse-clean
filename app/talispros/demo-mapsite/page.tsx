import DemoMapSiteBuilderClient from "@/components/talispros/demo-mapsite/DemoMapSiteBuilderClient";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { demoBuilderStartsOpen, demoInitialPinFromParams } from "@/lib/talispros/demo-builder";

export async function generateMetadata() {
  return pageMetadata("/talispros/demo-mapsite");
}

export const dynamic = "force-dynamic";

export default async function DemoMapSiteBuilderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // Deep links and Back (?build=1, ?address=…, ?lat=…&lng=…) open the card directly.
  return (
    <DemoMapSiteBuilderClient
      initialOpen={demoBuilderStartsOpen(params)}
      initialPin={demoInitialPinFromParams(params)}
    />
  );
}
