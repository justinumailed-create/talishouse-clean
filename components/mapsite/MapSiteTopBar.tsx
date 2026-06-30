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

const DESKTOP_SIDE_HEIGHT = "h-40 md:h-48";
const DESKTOP_SIDE_WIDTH = "w-40 md:w-48";

function AgentPhoto({
  agent,
  className,
  imageClassName,
}: {
  agent: MapSiteAgentData;
  className: string;
  imageClassName: string;
}) {
  return (
    <div className={className}>
      {agent.profileImageUrl ? (
        <Image
          src={agent.profileImageUrl}
          alt={agent.name}
          width={192}
          height={192}
          className={imageClassName}
          sizes="(max-width: 768px) 96px, 192px"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400 text-xs">
          Agent
        </div>
      )}
    </div>
  );
}

function ContactBlock({ agent }: { agent: MapSiteAgentData }) {
  return (
    <>
      <p className="text-xs text-neutral-500 mt-4 sm:mt-5 tracking-wide">
        Offered by
      </p>
      {agent.name && (
        <p className="text-base sm:text-lg font-medium text-neutral-800 mt-1">
          {agent.name}
        </p>
      )}
      {agent.phone?.trim() && (
        <p className="text-sm text-neutral-600 mt-1 break-all">
          {agent.phone.trim()}
        </p>
      )}
      {agent.email?.trim() && (
        <p className="text-sm text-neutral-600 mt-1 break-all">
          {agent.email.trim()}
        </p>
      )}
    </>
  );
}

export default function MapSiteTopBar({
  propertyTitle,
  logoUrl,
  agent,
}: MapSiteTopBarProps) {
  const headerLogo = logoUrl?.trim() || MAPSITE_HEADER_FALLBACK_LOGO;

  return (
    <header className="bg-[#f8f8f7] border-b border-neutral-200/80">
      <div className="px-4 sm:px-8 py-5 sm:py-6">
        <div className="flex flex-col items-center gap-4 text-center md:hidden">
          <div className="relative h-14 w-14 shrink-0">
            <Image
              src={headerLogo}
              alt="MapSite logo"
              width={56}
              height={56}
              className="h-14 w-14 object-contain mix-blend-multiply"
            />
          </div>

          <h1 className="text-xl font-semibold text-neutral-900 leading-snug tracking-tight px-1">
            {propertyTitle}
          </h1>

          <AgentPhoto
            agent={agent}
            className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg"
            imageClassName="h-24 w-24 object-cover object-top"
          />

          <div className="w-full min-w-0">
            <ContactBlock agent={agent} />
          </div>
        </div>

        <div className="hidden md:grid grid-cols-[auto_1fr_auto] items-center gap-6">
          <div className={`relative ${DESKTOP_SIDE_HEIGHT} shrink-0 bg-transparent`}>
            <Image
              src={headerLogo}
              alt="MapSite logo"
              width={192}
              height={192}
              className={`${DESKTOP_SIDE_HEIGHT} w-auto object-contain bg-transparent mix-blend-multiply`}
            />
          </div>

          <div className="min-w-0 text-center px-2">
            <h1 className="text-3xl md:text-4xl font-semibold text-neutral-900 leading-tight tracking-tight">
              {propertyTitle}
            </h1>
            <ContactBlock agent={agent} />
          </div>

          <AgentPhoto
            agent={agent}
            className={`relative ${DESKTOP_SIDE_HEIGHT} ${DESKTOP_SIDE_WIDTH} shrink-0 overflow-hidden rounded-lg`}
            imageClassName={`${DESKTOP_SIDE_HEIGHT} ${DESKTOP_SIDE_WIDTH} object-cover object-top`}
          />
        </div>
      </div>
    </header>
  );
}
