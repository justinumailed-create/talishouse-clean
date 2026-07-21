import { Settings } from "lucide-react";
import TalisBooksEmptyState from "@/components/talisbooks/platform/TalisBooksEmptyState";
import TalisBooksPageHeader from "@/components/talisbooks/platform/TalisBooksPageHeader";

export default function TalisBooksDashboardSettingsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <TalisBooksPageHeader
        title="Settings"
        description="Platform defaults for publishing, locales, and future integrations."
      />
      <TalisBooksEmptyState
        icon={Settings}
        title="Settings coming soon"
        description="Platform settings will land after the core book engine is in place."
      />
    </div>
  );
}
