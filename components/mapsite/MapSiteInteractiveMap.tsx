"use client";

import dynamic from "next/dynamic";

const GoogleMapSiteMap = dynamic(() => import("./GoogleMapSiteMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[320px] bg-neutral-100 animate-pulse" />
  ),
});

interface MapSiteInteractiveMapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  propertyTitle?: string;
  embedded?: boolean;
}

export default function MapSiteInteractiveMap({
  latitude,
  longitude,
  zoom = 15,
  propertyTitle,
  embedded = false,
}: MapSiteInteractiveMapProps) {
  const hasCoords =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const mapContent = hasCoords ? (
    <GoogleMapSiteMap
      latitude={latitude!}
      longitude={longitude!}
      zoom={zoom}
      title={propertyTitle}
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-neutral-50 text-sm text-neutral-500">
      {embedded
        ? "Add an Atlist map URL in admin, or set coordinates for Google Maps."
        : "Location coordinates not yet available."}
    </div>
  );

  if (embedded) {
    return <div className="w-full h-full min-h-[420px]">{mapContent}</div>;
  }

  return (
    <section className="bg-[#f8f8f7]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
        <div className="rounded-2xl border border-neutral-200 overflow-hidden shadow-sm bg-white">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-900">
              Interactive Map
            </h2>
            {hasCoords && (
              <p className="text-sm text-neutral-500 mt-1 font-mono">
                {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
              </p>
            )}
          </div>
          <div className="h-[320px] sm:h-[480px] lg:h-[560px]">{mapContent}</div>
        </div>
      </div>
    </section>
  );
}
