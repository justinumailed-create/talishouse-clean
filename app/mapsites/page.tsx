import DemoMapsitesPanel from "@/components/talispros/demo-mapsite/DemoMapsitesPanel";
import MarketsAdminGate from "@/components/talisu/MarketsAdminGate";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { loadFastCodeSlotsPanel } from "@/lib/talispros/fast-code-slots-server";
import { mapsitesFoldersUnlocked } from "@/lib/talispros/mapsites-folder-access.server";
import { loadSourcedLeadCalendar } from "@/lib/talispros/sourced-leads-server";

export async function generateMetadata() {
  const meta = await pageMetadata("/mapsites");
  // Internal marketing page: keep SEO tags, but never index it.
  return { ...meta, robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

export default async function MapsitesPage() {
  const account = await getAdminSessionAccount();
  if (!account) return <MarketsAdminGate />;

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
