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
  editAccess: MapSiteEditToolbarState;
}

export default function MapSiteLayout({
  data,
  visitorHasSubscribed,
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

        <main className="flex-1">
          <MapSiteAtlistMap
            atlistMapUrl={data.atlistMapUrl}
            propertyTitle={data.propertyTitle}
            latitude={data.mapCenter?.[0]}
            longitude={data.mapCenter?.[1]}
            zoom={data.mapZoom}
          />
          <MapSiteBottomPanels
            videoUrl={data.videoUrl}
            galleryImages={data.galleryImages}
            propertyTitle={data.propertyTitle}
            fastCode={data.fastCode}
            agentName={data.agent.name}
            agentEmail={data.agent.email}
            visitorHasSubscribed={visitorHasSubscribed}
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
      <MapSiteEditToolbar fastCode={data.fastCode} editAccess={editAccess} />
    </div>
  );
}
