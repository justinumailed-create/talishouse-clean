"use client";

import { useT } from "@/lib/i18n/client";

type TalisBrandMarkProps = {
  tagline: string;
  className?: string;
};

/**
 * Static Tsplits™ wordmark + tagline beside the blue header logo (no TalisU flip).
 * Rendered inside the header logo link, so it holds no link of its own.
 */
export default function TalisBrandMark({
  tagline,
  className = "",
}: TalisBrandMarkProps) {
  const t = useT();
  return (
    <span className={`block min-w-0 leading-tight ${className}`}>
      <span className="relative block h-[1.35em] overflow-hidden text-base font-bold tracking-wide text-white sm:text-lg">
        Tsplits™
      </span>
      <span className="block text-[12px] text-white/95 sm:text-[13px]">
        {tagline}
      </span>
      <span className="sr-only">{t.nav.brandSr}</span>
    </span>
  );
}
