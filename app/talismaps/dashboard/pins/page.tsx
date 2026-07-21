import { MapPin } from "lucide-react";
import TalisMapsEmptyState from "@/components/talismaps/platform/TalisMapsEmptyState";
import TalisMapsPageHeader from "@/components/talismaps/platform/TalisMapsPageHeader";

export default function TalisMapsPinsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <TalisMapsPageHeader
        title="Pins"
        description="Manage map pins including property listings, Adpro PINs, and featured locations."
      />
      <TalisMapsEmptyState
        icon={MapPin}
        title="Pin management coming soon"
        description="Pins will be organized by map and category with media attachments, coordinates, and metadata."
      />
    </div>
  );
}
