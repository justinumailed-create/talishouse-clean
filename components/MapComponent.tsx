"use client";

import dynamic from "next/dynamic";

const TalisMapsEmbed = dynamic(() => import("@/components/talismaps/TalisMapsEmbed"), {
  ssr: false,
});

interface MapComponentProps {
  associateId?: string;
  location?: { lat: number; lng: number };
}

export default function MapComponent({ associateId, location }: MapComponentProps) {
  return (
    <TalisMapsEmbed
      latitude={location?.lat}
      longitude={location?.lng}
      marketing={!location}
      pinLabel={associateId ? `Associate ${associateId.toUpperCase()}` : "Associate Location"}
      className="relative h-full w-full"
      minHeightClassName="min-h-[300px] lg:min-h-[500px]"
    />
  );
}
