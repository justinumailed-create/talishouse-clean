import { createTalisUMetadata } from "@/lib/talisu/seo";
import SectionShell from "@/components/talisu/SectionShell";
import TalisUKbPasswordGate from "@/components/talisu/TalisUKbPasswordGate";
import TalisUKbManagePanel from "@/components/talisu/TalisUKbManagePanel";

export const metadata = createTalisUMetadata({
  title: "TalisU™ | Knowledge Base — Update Content",
  description:
    "Update TalisU™ Knowledge Base Audios, Videos, and Learning Material.",
  path: "/talisu/kb/manage",
  private: true,
});

/**
 * KB content manage UI (same session unlock as /talisu/kb). Linked from rm22 Mapsite™ dashboard.
 */
export default function TalisUKnowledgeBaseManagePage() {
  return (
    <TalisUKbPasswordGate>
      <SectionShell
        title="Update Knowledge Base"
        subtitle="Manage Audios, Videos, and Learning Material shown after unlock on /talisu/kb."
      >
        <TalisUKbManagePanel />
      </SectionShell>
    </TalisUKbPasswordGate>
  );
}
