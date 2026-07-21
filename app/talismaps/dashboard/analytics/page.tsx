import { BarChart3 } from "lucide-react";
import TalisMapsEmptyState from "@/components/talismaps/platform/TalisMapsEmptyState";
import TalisMapsPageHeader from "@/components/talismaps/platform/TalisMapsPageHeader";

export default function TalisMapsAnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <TalisMapsPageHeader
        title="Analytics"
        description="Track map views, pin clicks, searches, QR scans, and marketing engagement."
      />
      <TalisMapsEmptyState
        icon={BarChart3}
        title="Analytics dashboard coming soon"
        description="Map analytics events will surface here with session tracking, referrers, and pin-level insights."
      />
    </div>
  );
}
