"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  TALISU_MKTS_HEADER_BLUE,
  TALISU_MKTS_HEADER_NAV,
  TALISU_MKTS_HEADER_TAGLINE,
} from "@/lib/talisu/markets-pins";

export default function TalisUMktsHeader() {
  const pathname = usePathname() || "/talisu/mkts";

  return (
    <header
      className="shrink-0 text-white shadow-sm"
      style={{ backgroundColor: TALISU_MKTS_HEADER_BLUE }}
    >
      <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
        <Link href="/talisu" className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/talisu/mkts/talisu-mark.png"
            alt="TalisU™"
            width={44}
            height={44}
            className="h-10 w-10 shrink-0 rounded-sm object-cover sm:h-11 sm:w-11"
            priority
          />
          <div className="min-w-0 leading-tight">
            <div className="text-base font-bold tracking-wide sm:text-lg">
              TalisU&trade;
            </div>
            <div className="truncate text-[12px] text-white/95 sm:text-[13px]">
              {TALISU_MKTS_HEADER_TAGLINE}
            </div>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          {TALISU_MKTS_HEADER_NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition sm:text-[15px] ${
                  active
                    ? "bg-white/20 text-white"
                    : "text-white hover:bg-white/15"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
