import { Settings } from "lucide-react";
import TalisBooksEmptyState from "@/components/talisbooks/platform/TalisBooksEmptyState";
import TalisBooksPageHeader from "@/components/talisbooks/platform/TalisBooksPageHeader";

export default function TalisBooksSettingsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
      <TalisBooksPageHeader
        title="Settings"
        description="Marketing-surface settings for the TalisBooks™ platform."
      />
      <TalisBooksEmptyState
        icon={Settings}
        title="Settings coming soon"
        description="Platform configuration will be available here and under the dashboard."
      />
    </div>
  );
}
