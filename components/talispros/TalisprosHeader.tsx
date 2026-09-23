"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { isTalisprosMarketLayoutPath } from "@/lib/talispros/market-pages";
import { isTalisprosStartPath } from "@/lib/talispros/start-content";
import { registerYourMapSiteFastCodeFromPath } from "@/lib/talispros/mapsite-url-gate";
import { buildClaimedMapSitePath } from "@/lib/talispros/mapsite-state";
import { ROUTES } from "@/lib/routes";

export default function TalisprosHeader() {
  const pathname = usePathname();
  const gateCode = registerYourMapSiteFastCodeFromPath(pathname);

  if (
    pathname.startsWith("/talispros/mapsites/") ||
    isTalisprosStartPath(pathname) ||
    isTalisprosMarketLayoutPath(pathname)
  ) {
    return null;
  }

  return (
    <header className="flex-shrink-0 bg-white border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-[72px]">
          <Link href={ROUTES.HOME} className="flex items-center gap-3 no-underline group">
            <Image
              src="/logo.png"
              alt="TalisPros™"
              width={32}
              height={32}
              className="w-7 h-7 object-contain"
              priority
            />
            <span className="text-[15px] font-semibold tracking-tight text-neutral-900 group-hover:text-neutral-600 transition-colors">
              TalisPros™ PMC
            </span>
          </Link>
          {gateCode ? (
            <Link
              href={buildClaimedMapSitePath({ fastCode: gateCode })}
              className="inline-flex shrink-0 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 no-underline shadow-sm hover:bg-neutral-50"
            >
              Back to Mapsite™
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

