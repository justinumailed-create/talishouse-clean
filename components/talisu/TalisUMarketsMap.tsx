"use client";

import dynamic from "next/dynamic";
import type { TalisMapsPin } from "@/lib/talismaps";

const TalisMapsEmbed = dynamic(
  () => import("@/components/talismaps/TalisMapsEmbed"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[480px] items-center justify-center bg-neutral-100 text-sm text-neutral-500">
        Loading map…
      </div>
    ),
  }
);

type Props = {
  pins: TalisMapsPin[];
};

export default function TalisUMarketsMap({ pins }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
      <TalisMapsEmbed
        pins={pins}
        marketing={pins.length === 0}
        className="relative h-[min(70vh,720px)] w-full"
        minHeightClassName="min-h-[420px]"
        emptyMessage="Market pins will appear here once Mapsites™ are live."
      />
    </div>
  );
}
