import { Shapes } from "lucide-react";
import TalisMapsEmptyState from "@/components/talismaps/platform/TalisMapsEmptyState";
import TalisMapsPageHeader from "@/components/talismaps/platform/TalisMapsPageHeader";

export default function TalisMapsTemplatesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <TalisMapsPageHeader
        title="Templates"
        description="Start from pre-built map templates for root accounts, derivative networks, and property markets."
      />
      <TalisMapsEmptyState
        icon={Shapes}
        title="Templates coming soon"
        description="Reusable map templates will accelerate onboarding for new FAST Code accounts."
      />
    </div>
  );
}
