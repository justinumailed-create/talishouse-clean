import { getT } from "@/lib/i18n/server";
import SectionShell from "@/components/talisu/SectionShell";
import TalisUKbPasswordGate from "@/components/talisu/TalisUKbPasswordGate";
import TalisUKbDashboard from "@/components/talisu/TalisUKbDashboard";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return pageMetadata("/talisu/kb");
}

/**
 * Knowledge Base dashboard. Protected by session unlock (navbar drop-pop / gate redirect).
 * Sections: Audios / Videos / Learning Material.
 */
export default async function TalisUKnowledgeBasePage() {
  const t = await getT();
  return (
    <TalisUKbPasswordGate>
      <SectionShell
        title={t.talisuHub.kbTitle}
        subtitle={t.talisuHub.kbSubtitle}
      >
        <TalisUKbDashboard />
      </SectionShell>
    </TalisUKbPasswordGate>
  );
}
