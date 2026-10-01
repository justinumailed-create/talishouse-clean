import { createTalisUMetadata } from "@/lib/talisu/seo";
import SectionShell from "@/components/talisu/SectionShell";
import TalisUKbPasswordGate from "@/components/talisu/TalisUKbPasswordGate";
import TalisUKbDashboard from "@/components/talisu/TalisUKbDashboard";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | Knowledge Base",
  description:
    "TalisU™ Knowledge Base — Audios, Videos, and Learning Material for Mapsites™ and FAST Codes™.",
  path: "/talisu/kb",
  private: true,
});

/**
 * Knowledge Base dashboard. Protected by session unlock (navbar drop-pop / gate redirect).
 * Sections: Audios / Videos / Learning Material.
 */
export default function TalisUKnowledgeBasePage() {
  return (
    <TalisUKbPasswordGate>
      <SectionShell
        title="Knowledge Base"
        subtitle="Audios, Videos, and Learning Material for TalisU™ partners."
      >
        <TalisUKbDashboard />
      </SectionShell>
    </TalisUKbPasswordGate>
  );
}
