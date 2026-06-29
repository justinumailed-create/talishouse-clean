import Image from "next/image";
import {
  MAPSITE_HEADER_FALLBACK_LOGO,
  type MapSiteAgentData,
} from "@/lib/mapsite-layout";

interface MapSiteTopBarProps {
  propertyTitle: string;
  logoUrl: string | null;
  agent: MapSiteAgentData;
}

const HEADER_SIDE_HEIGHT = "h-32 sm:h-40 md:h-48";
const HEADER_SIDE_WIDTH = "w-32 sm:w-40 md:w-48";

export default function MapSiteTopBar({
  propertyTitle,
  logoUrl,
  agent,
}: MapSiteTopBarProps) {
  const headerLogo = logoUrl?.trim() || MAPSITE_HEADER_FALLBACK_LOGO;

  return (
    <header className="bg-[#f8f8f7] border-b border-neutral-200/80">
      <div className="px-5 sm:px-8 py-5 sm:py-6">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 sm:gap-6">
          <div className={`relative ${HEADER_SIDE_HEIGHT} shrink-0 bg-transparent`}>
            <Image
              src={headerLogo}
              alt="MapSite logo"
              width={192}
              height={192}
              className={`${HEADER_SIDE_HEIGHT} w-auto object-contain bg-transparent mix-blend-multiply`}
            />
          </div>

          <div className="min-w-0 text-center px-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-neutral-900 leading-tight tracking-tight">
              {propertyTitle}
            </h1>
            <p className="text-xs text-neutral-500 mt-4 sm:mt-5 tracking-wide">
              Offered by
            </p>
            {agent.name && (
              <p className="text-base sm:text-lg font-medium text-neutral-800 mt-1">
                {agent.name}
              </p>
            )}
            {agent.phone?.trim() && (
              <p className="text-sm text-neutral-600 mt-1">{agent.phone.trim()}</p>
            )}
            {agent.email?.trim() && (
              <p className="text-sm text-neutral-600 mt-1">{agent.email.trim()}</p>
            )}
          </div>

          <div
            className={`relative ${HEADER_SIDE_HEIGHT} ${HEADER_SIDE_WIDTH} shrink-0 overflow-hidden rounded-lg`}
          >
            {agent.profileImageUrl ? (
              <Image
                src={agent.profileImageUrl}
                alt={agent.name}
                width={192}
                height={192}
                className={`${HEADER_SIDE_HEIGHT} ${HEADER_SIDE_WIDTH} object-cover object-top`}
                sizes="(max-width: 768px) 128px, 192px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400 text-xs">
                Agent
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
