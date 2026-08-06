"use client";

import dynamic from "next/dynamic";

const TalisMapsEmbed = dynamic(() => import("@/components/talismaps/TalisMapsEmbed"), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[320px] w-full animate-pulse bg-neutral-100" />
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

  const mapContent = (
    <TalisMapsEmbed
      latitude={hasCoords ? latitude : undefined}
      longitude={hasCoords ? longitude : undefined}
      zoom={zoom}
      pinLabel={propertyTitle}
      className="h-full w-full"
      minHeightClassName="min-h-[320px]"
      emptyMessage={
        embedded
          ? "Set coordinates or add Home PINs to display this property on Talismaps™."
          : "Location coordinates not yet available."
      }
    />
  );

  if (embedded) {
    return <div className="h-full min-h-[420px] w-full">{mapContent}</div>;
  }

  return (
    <section className="bg-[#f8f8f7]">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-neutral-900">
              Interactive Map
            </h2>
            {hasCoords && (
              <p className="mt-1 font-mono text-sm text-neutral-500">
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
