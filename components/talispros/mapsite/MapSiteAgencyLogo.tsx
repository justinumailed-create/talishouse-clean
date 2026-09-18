"use client";

import {
  mapsiteAgencyDisplayName,
  mapsiteAgencyLogoUrl,
} from "@/lib/talispros/mapsite-listing-media";

interface MapSiteAgencyLogoProps {
  logoUrl: string | null | undefined;
  agencyName?: string | null;
  compact?: boolean;
}

export default function MapSiteAgencyLogo({
  logoUrl,
  agencyName,
  compact = false,
}: MapSiteAgencyLogoProps) {
  const src = mapsiteAgencyLogoUrl(logoUrl);
  const name = mapsiteAgencyDisplayName(logoUrl, agencyName);
  const blendJpeg = /\.jpe?g$/i.test(src);

  return (
    <div className="relative flex flex-col items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name || "Agency logo"}
        className={`w-auto object-contain object-center ${
          compact
            ? "max-h-12 max-w-[5.5rem]"
            : "max-h-24 max-w-[min(100%,12rem)]"
        } ${blendJpeg ? "mix-blend-multiply" : ""}`}
      />
      {name ? (
        <p
          className={`mapsite-cloud-copy relative text-center font-sans font-bold leading-tight tracking-tight text-black ${
            compact
              ? "mt-0.5 text-[13px]"
              : "mt-1.5 text-[17px]"
          }`}
        >
          {name}
        </p>
      ) : null}
    </div>
  );
}
