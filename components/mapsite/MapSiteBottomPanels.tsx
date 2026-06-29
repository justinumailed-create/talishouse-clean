import MapSiteContactForm from "./MapSiteContactForm";
import MapSiteGalleryLightbox from "./MapSiteGalleryLightbox";
import MapSiteVideoSection from "./MapSiteVideoSection";

interface MapSiteBottomPanelsProps {
  videoUrl: string | null;
  galleryImages: string[];
  propertyTitle: string;
  fastCode: string;
  agentName: string;
  agentEmail: string;
}

function PanelHeader({ title }: { title: string }) {
  return (
    <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50 shrink-0">
      <h2 className="text-sm sm:text-base font-semibold text-neutral-800 text-center">
        {title}
      </h2>
    </div>
  );
}

export default function MapSiteBottomPanels({
  videoUrl,
  galleryImages,
  propertyTitle,
  fastCode,
  agentName,
  agentEmail,
}: MapSiteBottomPanelsProps) {
  return (
    <section className="bg-[#f8f8f7] pb-8 sm:pb-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:items-stretch">
          <div className="flex flex-col gap-4 sm:gap-6 min-h-0 lg:h-full">
            <div className="flex flex-1 flex-col min-h-[220px] rounded-2xl border border-neutral-200 overflow-hidden shadow-sm bg-white">
              <PanelHeader title="Play Video to hear my take" />
              <div className="flex-1 min-h-0 bg-neutral-100 relative">
                {videoUrl ? (
                  <MapSiteVideoSection videoUrl={videoUrl} embedded />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-neutral-400 px-6 text-center">
                    Video coming soon
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-1 flex-col min-h-[220px] rounded-2xl border border-neutral-200 overflow-hidden shadow-sm bg-white">
              <PanelHeader title="Select the Image to open a Lightbox Gallery" />
              <div className="flex-1 min-h-0 relative">
                <MapSiteGalleryLightbox
                  images={galleryImages}
                  propertyTitle={propertyTitle}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col min-h-0 rounded-2xl border border-neutral-200 overflow-hidden shadow-sm bg-white lg:h-full">
            <PanelHeader title="Express an Interest" />
            <div className="flex-1 min-h-0 flex flex-col">
              <MapSiteContactForm
                fastCode={fastCode}
                agentName={agentName}
                agentEmail={agentEmail}
                embedded
                fillHeight
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
