import type { MapSiteLayoutData } from "@/lib/mapsite-layout";
import type { MapSiteEditToolbarState } from "@/lib/mapsite-edit-auth";
import MapSiteTopBar from "./MapSiteTopBar";
import MapSiteAtlistMap from "./MapSiteAtlistMap";
import MapSiteBottomPanels from "./MapSiteBottomPanels";
import MapSiteFooter from "./MapSiteFooter";
import MapSiteEditToolbar from "./MapSiteEditToolbar";

interface MapSiteLayoutProps {
  data: MapSiteLayoutData;
  visitorHasSubscribed: boolean;
  visitorFastCode: string | null;
  editAccess: MapSiteEditToolbarState;
}

export default function MapSiteLayout({
  data,
  visitorHasSubscribed,
  visitorFastCode,
  editAccess,
}: MapSiteLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-200">
      <div className="mapsite-layout mx-auto w-full max-w-7xl min-h-screen border-x-0 md:border-x-[50px] border-neutral-300 bg-[#f8f8f7] flex flex-col pb-20 md:pb-0">
        <MapSiteTopBar
          propertyTitle={data.propertyTitle}
          logoUrl={data.logoUrl}
          agent={data.agent}
        />

        <main className="flex flex-col">
          <MapSiteAtlistMap
            atlistMapUrl={data.atlistMapUrl}
            propertyTitle={data.propertyTitle}
          />
          <MapSiteBottomPanels
            videoUrl={data.videoUrl}
            galleryItems={data.galleryItems}
            propertyTitle={data.propertyTitle}
            fastCode={data.fastCode}
            agentName={data.agent.name}
            agentEmail={data.agent.email}
            visitorHasSubscribed={visitorHasSubscribed}
            visitorFastCode={visitorFastCode}
            offeredSubscriptionTier={data.offeredSubscriptionTier}
            interestFormEnabled={data.interestFormEnabled}
          />
        </main>

        <MapSiteFooter
          fastCode={data.fastCode}
          agentName={data.agent.name}
          email={data.agent.email}
          updatedAt={data.updatedAt}
        />
      </div>
      <MapSiteEditToolbar
        fastCode={data.fastCode}
        editAccess={editAccess}
        initialHasSubscribed={visitorHasSubscribed}
        initialVisitorFastCode={visitorFastCode}
      />
    </div>
  );
}
