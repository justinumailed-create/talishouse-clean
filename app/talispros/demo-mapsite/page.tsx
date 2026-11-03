import DemoMapSiteBuilderClient from "@/components/talispros/demo-mapsite/DemoMapSiteBuilderClient";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { demoBuilderStartsOpen, demoInitialPinFromParams } from "@/lib/talispros/demo-builder";
import { loadFastCodeSlotsPanel } from "@/lib/talispros/fast-code-slots-server";

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
  // FAST Code slots: codes, towns and provinces for everyone, never who
  // prepared them; the signed-in agent also gets their own editable list.
  const slotsPanel = await loadFastCodeSlotsPanel();
  // Deep links and Back (?build=1, ?address=…, ?lat=…&lng=…) open the card directly.
  return (
    <DemoMapSiteBuilderClient
      initialOpen={demoBuilderStartsOpen(params)}
      initialPin={demoInitialPinFromParams(params)}
      slotsPanel={slotsPanel}
    />
  );
}
