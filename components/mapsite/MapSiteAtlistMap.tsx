import { resolveMapsiteAtlistMapUrl } from "@/lib/mapsite-atlist";

interface MapSiteAtlistMapProps {
  atlistMapUrl: string | null;
  propertyTitle: string;
}

function normalizeAtlistUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes("share=true")) return trimmed;
  const separator = trimmed.includes("?") ? "&" : "?";
  return `${trimmed}${separator}share=true`;
}

export default function MapSiteAtlistMap({
  atlistMapUrl,
  propertyTitle,
}: MapSiteAtlistMapProps) {
  const embedUrl = normalizeAtlistUrl(resolveMapsiteAtlistMapUrl(atlistMapUrl));

  return (
    <section className="bg-[#f8f8f7]">
      <div className="px-4 sm:px-8">
        <div className="relative rounded-2xl border border-neutral-200 overflow-hidden shadow-sm bg-white min-h-[300px] sm:min-h-[440px] md:min-h-[520px]">
          <iframe
            src={embedUrl}
            allow="geolocation 'self' https://my.atlist.com"
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
            frameBorder={0}
            scrolling="no"
            allowFullScreen
            id="atlist-embed"
            title={`${propertyTitle} map`}
          />
        </div>
      </div>
    </section>
  );
}
