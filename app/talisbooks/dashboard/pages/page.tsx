import { FileText } from "lucide-react";
import TalisBooksEmptyState from "@/components/talisbooks/platform/TalisBooksEmptyState";
import TalisBooksPageHeader from "@/components/talisbooks/platform/TalisBooksPageHeader";

export default function TalisBooksPagesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <TalisBooksPageHeader
        title="Pages"
        description="Compose and reorder book pages with layouts, images, and structured content blocks."
      />
      <TalisBooksEmptyState
        icon={FileText}
        title="Pages coming soon"
        description="Book page management will connect to BookPages once the composition engine ships."
      />
    </div>
  );
}
