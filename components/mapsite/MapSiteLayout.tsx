import {
  mapsiteFullscreenMapHref,
  type MapSiteLayoutData,
} from "@/lib/mapsite-layout";
import type { MapSiteEditToolbarState } from "@/lib/mapsite-edit-auth";
import MapSiteTopBar from "./MapSiteTopBar";
import MapSiteTalisMaps from "./MapSiteTalisMaps";
import MapSiteBottomPanels from "./MapSiteBottomPanels";
import MapSiteFooter from "./MapSiteFooter";
import MapSiteEditToolbar from "./MapSiteEditToolbar";

interface MapSiteLayoutProps {
  data: MapSiteLayoutData;
  visitorHasSubscribed: boolean;
  visitorFastCode: string | null;
  editAccess: MapSiteEditToolbarState;
  buildRequestId?: string;
  paymentReceived?: boolean;
}

export default function MapSiteLayout({
  data,
  visitorHasSubscribed,
  visitorFastCode,
  editAccess,
  buildRequestId,
  paymentReceived = false,
}: MapSiteLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-200">
      <div className="mapsite-layout mx-auto flex min-h-screen w-full max-w-7xl flex-col border-x-0 border-neutral-300 bg-[#f8f8f7] pb-20 md:border-x-[50px] md:pb-0">
        <MapSiteTopBar
          propertyTitle={data.propertyTitle}
          logoUrl={data.logoUrl}
          agent={data.agent}
        />

        <main className="flex flex-col">
          <MapSiteTalisMaps
            pins={data.pins}
            mapCenter={data.mapCenter}
            mapZoom={data.mapZoom}
            propertyTitle={data.propertyTitle}
          >
            <a
              href={mapsiteFullscreenMapHref(data.fastCode)}
              target="_blank"
              rel="noopener noreferrer"
              title="Open this map and PIN in a new window"
              className="absolute bottom-3 right-3 z-[2147483647] inline-flex min-h-10 items-center rounded-xl border border-neutral-200 bg-white/95 px-3 py-2 text-sm font-medium text-neutral-900 shadow-md backdrop-blur transition hover:bg-white sm:bottom-4 sm:right-4"
            >
              Open full screen
            </a>
          </MapSiteTalisMaps>
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
            buildRequestId={buildRequestId}
            paymentReceived={paymentReceived}
            tebHref={data.tebHref}
            ttvHref={data.ttvHref}
            scheduleHref={data.scheduleHref}
            brokerageName={data.brokerageName}
            brokerageLogoUrl={data.brokerageLogoUrl}
            brokerageWebsite={data.brokerageWebsite}
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
