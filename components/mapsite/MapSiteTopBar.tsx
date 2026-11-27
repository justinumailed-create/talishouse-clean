import Image from "next/image";
import {
  MAPSITE_HEADER_FALLBACK_LOGO,
  type MapSiteAgentData,
} from "@/lib/mapsite-layout";
import MapSiteAgentPhoto from "./MapSiteAgentPhoto";
import ProtectedContactReveal from "@/components/talispros/personal-home/ProtectedContactReveal";

interface MapSiteTopBarProps {
  propertyTitle: string;
  logoUrl: string | null;
  agent: MapSiteAgentData;
  fastCode: string;
  hasPhone?: boolean;
  hasEmail?: boolean;
}

const AVATAR_SIZE =
  "h-28 w-28 sm:h-36 sm:w-36 md:h-40 md:w-40 lg:h-44 lg:w-44";

function shouldBlendLogoBackground(logoUrl: string): boolean {
  return /\.jpe?g$/i.test(logoUrl);
}

function LogoMark({ logoUrl }: { logoUrl: string }) {
  const blend = shouldBlendLogoBackground(logoUrl);

  return (
    <div className={`relative shrink-0 overflow-hidden ${AVATAR_SIZE}`}>
      <Image
        src={logoUrl}
        alt="Mapsite logo"
        fill
        className={`object-contain object-center scale-[1.42] ${blend ? "mix-blend-multiply" : ""}`}
        sizes="(max-width: 768px) 112px, 176px"
        priority
      />
    </div>
  );
}

function ContactRow({
  fastCode,
  hasPhone,
  hasEmail,
}: {
  fastCode: string;
  hasPhone: boolean;
  hasEmail: boolean;
}) {
  if (!hasPhone && !hasEmail) return null;

  return (
    <div className="mt-3 flex flex-col gap-2 text-sm text-neutral-600 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-6 md:mt-4">
      {hasPhone ? (
        <ProtectedContactReveal
          code={fastCode}
          field="phone"
          surface="mapsite"
          className="hover:text-neutral-900 transition-colors"
          testId="mapsite-topbar-contact-phone"
        />
      ) : null}
      {hasEmail ? (
        <ProtectedContactReveal
          code={fastCode}
          field="email"
          surface="mapsite"
          className="hover:text-neutral-900 transition-colors"
          testId="mapsite-topbar-contact-email"
        />
      ) : null}
    </div>
  );
}

export default function MapSiteTopBar({
  propertyTitle,
  logoUrl,
  agent,
  fastCode,
  hasPhone = false,
  hasEmail = false,
}: MapSiteTopBarProps) {
  const headerLogo = logoUrl?.trim() || MAPSITE_HEADER_FALLBACK_LOGO;

  return (
    <header className="bg-[#f8f8f7] border-b border-neutral-200/80">
      <div className="px-4 sm:px-8 py-6 sm:py-8">
        <div className="flex flex-col items-center gap-6 text-center md:hidden">
          <LogoMark logoUrl={headerLogo} />
          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 leading-snug tracking-tight px-1">
            {propertyTitle}
          </h1>
          <ContactRow fastCode={fastCode} hasPhone={hasPhone} hasEmail={hasEmail} />
          <MapSiteAgentPhoto agent={agent} className={AVATAR_SIZE} />
        </div>

        <div className="hidden md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:gap-8 lg:gap-10">
          <LogoMark logoUrl={headerLogo} />

          <div className="min-w-0 px-2 text-center">
            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold text-neutral-900 leading-tight tracking-tight">
              {propertyTitle}
            </h1>
            <ContactRow fastCode={fastCode} hasPhone={hasPhone} hasEmail={hasEmail} />
          </div>

          <MapSiteAgentPhoto agent={agent} className={`shrink-0 ${AVATAR_SIZE}`} />
        </div>
      </div>
    </header>
  );
}
