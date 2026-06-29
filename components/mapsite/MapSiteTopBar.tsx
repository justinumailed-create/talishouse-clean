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

function formatContactLine(agent: MapSiteAgentData): string {
  const parts = [agent.name];
  if (agent.phone?.trim()) parts.push(agent.phone.trim());
  if (agent.email?.trim()) parts.push(agent.email.trim());
  return parts.join(" · ");
}

export default function MapSiteTopBar({
  propertyTitle,
  logoUrl,
  agent,
}: MapSiteTopBarProps) {
  const headerLogo = logoUrl?.trim() || MAPSITE_HEADER_FALLBACK_LOGO;

  return (
    <header className="bg-[#f8f8f7] border-b border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 sm:py-6">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 sm:gap-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-neutral-200/80 border border-neutral-200 flex items-center justify-center overflow-hidden shrink-0">
            <Image
              src={headerLogo}
              alt="MapSite logo"
              width={80}
              height={80}
              className="w-full h-full object-contain p-2"
            />
          </div>

          <div className="min-w-0 text-center sm:text-left">
            <h1 className="text-lg sm:text-2xl font-semibold text-neutral-900 leading-tight tracking-tight">
              {propertyTitle}
            </h1>
            <p className="text-sm text-neutral-600 mt-2">
              <span className="text-neutral-500">Offered by:</span>{" "}
              {formatContactLine(agent)}
            </p>
          </div>

          <div className="w-16 h-20 sm:w-24 sm:h-28 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 shrink-0">
            {agent.profileImageUrl ? (
              <Image
                src={agent.profileImageUrl}
                alt={agent.name}
                width={96}
                height={112}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                Agent
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
