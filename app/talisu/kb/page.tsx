import { createTalisUMetadata } from "@/lib/talisu/seo";
import SectionShell from "@/components/talisu/SectionShell";
import TalisUKbPasswordGate from "@/components/talisu/TalisUKbPasswordGate";
import { TALISU_CARD } from "@/lib/talisu/ui";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | Knowledge Base",
  description:
    "TalisU™ Knowledge Base — guides for Mapsites™, FAST Codes™, and market claims.",
  path: "/talisu/kb",
  private: true,
});

/**
 * Knowledge Base shell. Protected by a simple password gate (Admin123).
 */
export default function TalisUKnowledgeBasePage() {
  return (
    <TalisUKbPasswordGate>
      <SectionShell
        title="Knowledge Base"
        subtitle="Guides and reference for TalisU™ partners."
      >
        <div className={`${TALISU_CARD} px-6 py-12 text-center`}>
          <p className="text-sm text-neutral-600">
            Articles and playbooks will land here. Until then, start from{" "}
            <a href="/talisu" className="font-medium text-[#046BD9] underline">
              Welcome
            </a>{" "}
            or the{" "}
            <a href="/talisu/au" className="font-medium text-[#046BD9] underline">
              Audio Files
            </a>
            .
          </p>
        </div>
      </SectionShell>
    </TalisUKbPasswordGate>
  );
}
