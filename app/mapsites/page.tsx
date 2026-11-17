import DemoMapsitesPanel from "@/components/talispros/demo-mapsite/DemoMapsitesPanel";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { loadFastCodeSlotsPanel } from "@/lib/talispros/fast-code-slots-server";
import { mapsitesFoldersUnlocked } from "@/lib/talispros/mapsites-folder-access.server";
import { loadSourcedLeadCalendar } from "@/lib/talispros/sourced-leads-server";

export async function generateMetadata() {
  return pageMetadata("/mapsites");
}

export const dynamic = "force-dynamic";

export default async function MapsitesPage() {
  const foldersUnlocked = await mapsitesFoldersUnlocked();
  const [slotsPanel, sourced] = await Promise.all([
    foldersUnlocked ? loadFastCodeSlotsPanel() : Promise.resolve({ associates: [], own: null }),
    loadSourcedLeadCalendar(foldersUnlocked),
  ]);

  return (
    <DemoMapsitesPanel
      slotsPanel={slotsPanel}
      foldersUnlocked={foldersUnlocked}
      sourced={sourced}
    />
  );
}
