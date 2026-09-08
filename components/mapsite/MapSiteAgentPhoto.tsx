"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cutoutAgentPhoto } from "@/lib/media/cutout-agent-photo";
import type { MapSiteAgentData } from "@/lib/mapsite-layout";

interface MapSiteAgentPhotoProps {
  agent: MapSiteAgentData;
  className: string;
}

export default function MapSiteAgentPhoto({
  agent,
  className,
}: MapSiteAgentPhotoProps) {
  const sourceUrl = agent.profileImageUrl?.trim() || "";
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceUrl) return;
    let cancelled = false;
    void cutoutAgentPhoto(sourceUrl).then((url) => {
      if (!cancelled) setCutoutUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [sourceUrl]);

  return (
    <div className={`relative overflow-visible ${className}`}>
      {cutoutUrl ? (
        // Blob URL from the on-device cutout; not a remote Next Image source.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cutoutUrl}
          alt={agent.name}
          className="absolute inset-0 h-full w-full object-contain object-bottom drop-shadow-[0_12px_18px_rgba(0,0,0,0.18)]"
        />
      ) : sourceUrl ? (
        <Image
          src={sourceUrl}
          alt={agent.name}
          fill
          unoptimized
          className="origin-top scale-[1.38] object-cover object-[center_18%]"
          sizes="(max-width: 768px) 112px, 176px"
          priority
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-xl bg-neutral-100 text-xs text-neutral-400">
          Agent
        </div>
      )}
    </div>
  );
}
