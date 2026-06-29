import type { MapSiteLayoutData } from "@/lib/mapsite-layout";
import MapSiteTopBar from "./MapSiteTopBar";
import MapSiteAtlistMap from "./MapSiteAtlistMap";
import MapSiteBottomPanels from "./MapSiteBottomPanels";
import MapSiteFooter from "./MapSiteFooter";

interface MapSiteLayoutProps {
  data: MapSiteLayoutData;
}

export default function MapSiteLayout({ data }: MapSiteLayoutProps) {
  return (
    <div className="mapsite-layout min-h-screen bg-[#f8f8f7] flex flex-col">
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
        />
      </main>

      <MapSiteFooter
        fastCode={data.fastCode}
        agentName={data.agent.name}
        email={data.agent.email}
        updatedAt={data.updatedAt}
      />
    </div>
  );
}
