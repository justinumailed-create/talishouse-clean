import { Download } from "lucide-react";
import TalisMapsEmptyState from "@/components/talismaps/platform/TalisMapsEmptyState";
import TalisMapsPageHeader from "@/components/talismaps/platform/TalisMapsPageHeader";

export default function TalisMapsImportsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <TalisMapsPageHeader
        title="Imports"
        description="Import pins and categories from Atlist, spreadsheets, or existing MapSite data."
      />
      <TalisMapsEmptyState
        icon={Download}
        title="Import tools coming soon"
        description="Bulk import workflows will help migrate from Atlist and onboard derivative account networks."
      />
    </div>
  );
}
