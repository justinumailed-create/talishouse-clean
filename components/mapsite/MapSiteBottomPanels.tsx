import MapSiteCreateNewPanel from "./MapSiteCreateNewPanel";
import MapSiteCreativeLinks from "./MapSiteCreativeLinks";
import { PUBLISHED_MAPSITE_SHELL } from "@/lib/mapsite-layout";

interface MapSiteBottomPanelsProps {
  fastCode: string;
  buildRequestId?: string;
  tebHref?: string;
  ttvHref?: string;
  scheduleHref?: string;
  brokerageName?: string;
  brokerageLogoUrl?: string | null;
  brokerageWebsite?: string | null;
}

const CREATIVE_CHROME =
  "bg-[#f8f8f7] px-6 py-14 sm:px-10 sm:py-16 lg:min-h-[calc(100dvh-3rem)] lg:px-12 lg:py-20";

export default function MapSiteBottomPanels({
  fastCode,
  buildRequestId,
  tebHref,
  ttvHref,
  scheduleHref,
  brokerageName,
  brokerageLogoUrl,
  brokerageWebsite,
}: MapSiteBottomPanelsProps) {
  return (
    <section
      className="border-t border-neutral-200/80"
      data-mapsite-published-shell={PUBLISHED_MAPSITE_SHELL}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-stretch">
        <div className={CREATIVE_CHROME}>
          <MapSiteCreativeLinks
            fastCode={fastCode}
            tebHref={tebHref}
            ttvHref={ttvHref}
            scheduleHref={scheduleHref}
            brokerageName={brokerageName}
            brokerageLogoUrl={brokerageLogoUrl}
            brokerageWebsite={brokerageWebsite}
          />
        </div>

        <div className={`${CREATIVE_CHROME} lg:border-l lg:border-neutral-200/70`}>
          <MapSiteCreateNewPanel
            fastCode={fastCode}
            buildRequestId={buildRequestId}
          />
        </div>
      </div>
    </section>
  );
}
