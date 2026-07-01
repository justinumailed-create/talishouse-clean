import MapSiteGalleryLightbox from "./MapSiteGalleryLightbox";
import MapSiteContextPanel from "./MapSiteContextPanel";
import MapSitePanelHeader from "./MapSitePanelHeader";
import MapSiteVideoSection from "./MapSiteVideoSection";
import type { MapSiteGalleryDisplayItem } from "@/lib/mapsite-gallery";
import type { OfferedSubscriptionTier } from "@/lib/mapsite-subscription";

interface MapSiteBottomPanelsProps {
  videoUrl: string | null;
  galleryItems: MapSiteGalleryDisplayItem[];
  propertyTitle: string;
  fastCode: string;
  agentName: string;
  agentEmail: string;
  visitorHasSubscribed: boolean;
  visitorFastCode: string | null;
  offeredSubscriptionTier: OfferedSubscriptionTier;
  interestFormEnabled: boolean;
}

export default function MapSiteBottomPanels({
  videoUrl,
  galleryItems,
  propertyTitle,
  fastCode,
  agentName,
  agentEmail,
  visitorHasSubscribed,
  visitorFastCode,
  offeredSubscriptionTier,
  interestFormEnabled,
}: MapSiteBottomPanelsProps) {
  return (
    <section className="border-t border-neutral-200">
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-stretch">
        <div className="bg-[#f8f8f7] px-4 sm:px-8 py-6 sm:py-8">
          <div className="flex flex-col gap-6 min-h-0 lg:h-full">
            <div className="flex flex-1 flex-col min-h-[240px] rounded-2xl border border-neutral-200 overflow-hidden shadow-sm bg-white">
              <MapSitePanelHeader
                title="Play Video"
                className="bg-neutral-400 border-neutral-300"
                titleClassName="text-white"
                useLatoBold
              />
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

            <div className="flex flex-1 flex-col min-h-[240px] rounded-2xl border border-neutral-200 overflow-hidden shadow-sm bg-white">
              <MapSitePanelHeader
                title="Image Gallery"
                className="bg-neutral-400 border-neutral-300"
                titleClassName="text-white"
                useLatoBold
              />
              <div className="flex-1 min-h-0 relative">
                <MapSiteGalleryLightbox
                  items={galleryItems}
                  propertyTitle={propertyTitle}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#e2e5ea] px-4 sm:px-8 py-6 sm:py-8 lg:border-l border-neutral-200">
          <MapSiteContextPanel
            fastCode={fastCode}
            agentName={agentName}
            agentEmail={agentEmail}
            offeredSubscriptionTier={offeredSubscriptionTier}
            interestFormEnabled={interestFormEnabled}
            initialHasSubscribed={visitorHasSubscribed}
            initialVisitorFastCode={visitorFastCode}
          />
        </div>
      </div>
    </section>
  );
}
