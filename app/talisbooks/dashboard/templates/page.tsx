import TalisBooksCoverTemplateGallery from "@/components/talisbooks/covers/TalisBooksCoverTemplateGallery";
import TalisBooksPageHeader from "@/components/talisbooks/platform/TalisBooksPageHeader";

export default function TalisBooksTemplatesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <TalisBooksPageHeader
        title="Templates"
        description="Premium cover templates with large hero imagery, modern typography, and white top and bottom margins. Select manually or at random."
      />
      <TalisBooksCoverTemplateGallery />
    </div>
  );
}
