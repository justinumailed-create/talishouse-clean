import { Palette } from "lucide-react";
import TalisMapsEmptyState from "@/components/talismaps/platform/TalisMapsEmptyState";
import TalisMapsPageHeader from "@/components/talismaps/platform/TalisMapsPageHeader";

export default function TalisMapsThemesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <TalisMapsPageHeader
        title="Themes"
        description="Customize map appearance with colors, pin styles, and branded themes per map."
      />
      <TalisMapsEmptyState
        icon={Palette}
        title="Theme editor coming soon"
        description="Map themes will support primary and accent colors, pin styles, map styles, and custom CSS."
      />
    </div>
  );
}
