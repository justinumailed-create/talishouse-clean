import { Users } from "lucide-react";
import TalisBooksEmptyState from "@/components/talisbooks/platform/TalisBooksEmptyState";
import TalisBooksPageHeader from "@/components/talisbooks/platform/TalisBooksPageHeader";

export default function TalisBooksAuthorsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <TalisBooksPageHeader
        title="Authors"
        description="Author profiles linked to books and optionally to Talispros™ accounts."
      />
      <TalisBooksEmptyState
        icon={Users}
        title="Authors coming soon"
        description="Author management will surface once book creation workflows are live."
      />
    </div>
  );
}
