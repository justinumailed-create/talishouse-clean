import { createTalisUMetadata } from "@/lib/talisu/seo";
import { getLocale, getT } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import SectionShell from "@/components/talisu/SectionShell";
import TalisUKbPasswordGate from "@/components/talisu/TalisUKbPasswordGate";
import TalisUKbDashboard from "@/components/talisu/TalisUKbDashboard";

export async function generateMetadata() {
  const locale = await getLocale();
  const m = getDictionary(locale).meta.talisuKb;
  return createTalisUMetadata({
    title: m.title,
    description: m.description,
    path: "/talisu/kb",
    private: true,
    locale,
  });
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
