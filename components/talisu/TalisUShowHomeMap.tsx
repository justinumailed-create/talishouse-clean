"use client";

import dynamic from "next/dynamic";
import { SEA_CAN_SHOW_HOME } from "@/lib/talisu/content";

const TalisMapsEmbed = dynamic(
  () => import("@/components/talismaps/TalisMapsEmbed"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[360px] items-center justify-center bg-neutral-100 text-sm text-neutral-500">
        Loading map…
      </div>
    ),
  }
);

export default function TalisUShowHomeMap() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
      <TalisMapsEmbed
        latitude={SEA_CAN_SHOW_HOME.latitude}
        longitude={SEA_CAN_SHOW_HOME.longitude}
        pinLabel={SEA_CAN_SHOW_HOME.pinLabel}
        zoom={12}
        className="relative h-[min(55vh,520px)] w-full"
        minHeightClassName="min-h-[360px]"
      />
    </div>
  );
}
