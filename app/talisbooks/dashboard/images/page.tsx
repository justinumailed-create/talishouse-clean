import { Image } from "lucide-react";
import TalisBooksEmptyState from "@/components/talisbooks/platform/TalisBooksEmptyState";
import TalisBooksPageHeader from "@/components/talisbooks/platform/TalisBooksPageHeader";

export default function TalisBooksImagesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <TalisBooksPageHeader
        title="Images"
        description="Media library for covers, page backgrounds, and inline book imagery."
      />
      <TalisBooksEmptyState
        icon={Image}
        title="Image library coming soon"
        description="Upload and organize Images tied to authors and books."
      />
    </div>
  );
}
