import { BookOpen } from "lucide-react";
import TalisBooksEmptyState from "@/components/talisbooks/platform/TalisBooksEmptyState";
import TalisBooksPageHeader from "@/components/talisbooks/platform/TalisBooksPageHeader";

export default function TalisBooksEditorPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <TalisBooksPageHeader
          title="Book Editor"
          description="Architecture stub for the future visual book editor."
        />
        <TalisBooksEmptyState
          icon={BookOpen}
          title="Editor coming soon"
          description="The editor will compose BookPages using Templates, Layouts, and Images."
        />
      </div>
    </div>
  );
}
