"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  TALISU_PRIMARY_NAV,
  TALISU_SEACANS_NAV,
} from "@/lib/talisu/content";
import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";

function navActive(pathname: string, href: string): boolean {
  if (href === "/talisu") return pathname === "/talisu" || pathname === "/talisu/";
  if (href.startsWith("/talisu/")) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function TalisUChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/talisu";
  const isMkts =
    pathname === "/talisu/mkts" || pathname.startsWith("/talisu/mkts/");

  // Markets page uses the live Atlist-style blue header + full-bleed map.
  if (isMkts) {
    return (
      <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-neutral-950 text-white">
        <TalisUMktsHeader />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link href="/talisu" className="flex shrink-0 items-center gap-3">
            <Image
              src="/talisu/Windswept.jpg"
              alt="TalisU™"
              width={40}
              height={40}
              className="rounded-md object-cover"
            />
            <span className="text-lg font-semibold tracking-wide">
              TalisU&trade;
            </span>
          </Link>

          <nav className="flex flex-wrap justify-end gap-1.5 text-xs sm:text-sm">
            {TALISU_PRIMARY_NAV.map((item) => {
              const active = navActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1.5 transition ${
                    active
                      ? "bg-white font-medium text-neutral-950"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-white/5 bg-neutral-900/80">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2 text-xs">
            <span className="mr-1 uppercase tracking-wider text-white/50">
              Sea-Cans
            </span>
            {TALISU_SEACANS_NAV.map((item) => {
              const active = navActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-2.5 py-1 transition ${
                    active
                      ? "bg-amber-500/20 text-amber-200"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/40">
        <p>
          TalisU&trade; · part of{" "}
          <Link href="/" className="underline hover:text-white/70">
            Talispros&trade;
          </Link>
        </p>
      </footer>
    </div>
  );
}
