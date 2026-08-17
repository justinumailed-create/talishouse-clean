"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { isTalisprosStartPath } from "@/lib/talispros/start-content";

export default function TalisprosHeader() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/talispros/mapsites/") ||
    isTalisprosStartPath(pathname) ||
    pathname.startsWith("/talispros/markets/")
  ) {
    return null;
  }

  return (
    <header className="flex-shrink-0 bg-white border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex items-center h-[72px]">
          <Link href="/talispros" className="flex items-center gap-3 no-underline group">
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
        </div>
      </div>
    </header>
  );
}
