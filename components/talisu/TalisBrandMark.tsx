"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";

type TalisBrandMarkProps = {
  tagline: string;
  className?: string;
};

/**
 * Static Talispros™ wordmark beside the blue header logo (no TalisU flip).
 */
export default function TalisBrandMark({
  tagline,
  className = "",
}: TalisBrandMarkProps) {
  const t = useT();
  return (
    <div className={`min-w-0 leading-tight ${className}`}>
      <div className="relative h-[1.35em] overflow-hidden text-base font-bold tracking-wide sm:text-lg">
        <Link href="/" className="block text-white hover:text-white/95">
          Talispros™
        </Link>
      </div>
      <div className="text-[12px] text-white/95 sm:text-[13px]">{tagline}</div>
      <span className="sr-only">{t.nav.brandSr}</span>
    </div>
  );
}
