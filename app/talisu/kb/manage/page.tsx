import SectionShell from "@/components/talisu/SectionShell";
import TalisUKbPasswordGate from "@/components/talisu/TalisUKbPasswordGate";
import TalisUKbManagePanel from "@/components/talisu/TalisUKbManagePanel";
import { adminMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return adminMetadata("Knowledge Base Manager");
}

/**
 * KB content manage UI (same session unlock as /talisu/kb). Linked from rm22 Mapsite dashboard.
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
