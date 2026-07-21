import { Image } from "lucide-react";
import TalisMapsEmptyState from "@/components/talismaps/platform/TalisMapsEmptyState";
import TalisMapsPageHeader from "@/components/talismaps/platform/TalisMapsPageHeader";

export default function TalisMapsMediaPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <TalisMapsPageHeader
        title="Media"
        description="Upload and organize images, videos, and documents attached to map pins and assets."
      />
      <TalisMapsEmptyState
        icon={Image}
        title="Media library coming soon"
        description="Pin media and map assets will be managed here with sort order and primary image selection."
      />
    </div>
  );
}
