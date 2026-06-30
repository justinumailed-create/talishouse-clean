import MapSiteGalleryLightbox from "./MapSiteGalleryLightbox";
import MapSiteContextPanel from "./MapSiteContextPanel";
import MapSiteVideoSection from "./MapSiteVideoSection";
import type { OfferedSubscriptionTier } from "@/lib/mapsite-subscription";

interface MapSiteBottomPanelsProps {
  videoUrl: string | null;
  galleryImages: string[];
  propertyTitle: string;
  fastCode: string;
  agentName: string;
  agentEmail: string;
  visitorHasSubscribed: boolean;
  offeredSubscriptionTier: OfferedSubscriptionTier;
  interestFormEnabled: boolean;
}

function PanelHeader({ title }: { title: string }) {
  return (
    <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50 shrink-0">
      <h2 className="text-xs sm:text-base font-semibold text-neutral-800 text-center leading-snug px-1">
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
  visitorHasSubscribed,
  offeredSubscriptionTier,
  interestFormEnabled,
}: MapSiteBottomPanelsProps) {
  return (
    <section className="pb-8 sm:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
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

          <MapSiteContextPanel
            fastCode={fastCode}
            agentName={agentName}
            agentEmail={agentEmail}
            offeredSubscriptionTier={offeredSubscriptionTier}
            interestFormEnabled={interestFormEnabled}
            initialHasSubscribed={visitorHasSubscribed}
          />
        </div>
      </div>
    </section>
  );
}
