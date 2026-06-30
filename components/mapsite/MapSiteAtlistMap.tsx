import MapSiteInteractiveMap from "./MapSiteInteractiveMap";

interface MapSiteAtlistMapProps {
  atlistMapUrl: string | null;
  propertyTitle: string;
  latitude?: number;
  longitude?: number;
  zoom?: number;
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
  latitude,
  longitude,
  zoom,
}: MapSiteAtlistMapProps) {
  const embedUrl = atlistMapUrl ? normalizeAtlistUrl(atlistMapUrl) : null;

  return (
    <section className="bg-[#f8f8f7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8">
        <div className="relative rounded-2xl border border-neutral-200 overflow-hidden shadow-sm bg-white min-h-[280px] sm:min-h-[420px] md:min-h-[560px]">
          {embedUrl ? (
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
          ) : (
            <div className="absolute inset-0">
              <MapSiteInteractiveMap
                latitude={latitude}
                longitude={longitude}
                zoom={zoom}
                propertyTitle={propertyTitle}
                embedded
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
