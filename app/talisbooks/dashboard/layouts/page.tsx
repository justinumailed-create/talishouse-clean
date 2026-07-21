import { LayoutTemplate } from "lucide-react";
import TalisBooksEmptyState from "@/components/talisbooks/platform/TalisBooksEmptyState";
import TalisBooksPageHeader from "@/components/talisbooks/platform/TalisBooksPageHeader";

export default function TalisBooksLayoutsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <TalisBooksPageHeader
        title="Layouts"
        description="Page composition layouts — cover, single, spread, gallery, and custom grids."
      />
      <TalisBooksEmptyState
        icon={LayoutTemplate}
        title="Layouts coming soon"
        description="The layout engine will power BookPages composition."
      />
    </div>
  );
}
