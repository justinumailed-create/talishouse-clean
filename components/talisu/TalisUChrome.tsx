"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  TALISU_PRIMARY_NAV,
  TALISU_SEACANS_NAV,
} from "@/lib/talisu/content";

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

  return (
    <div className="min-h-dvh flex flex-col bg-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-950/95 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-4 justify-between">
          <Link href="/talisu" className="flex items-center gap-3 shrink-0">
            <Image
              src="/talisu/Windswept.jpg"
              alt="TalisU™"
              width={40}
              height={40}
              className="rounded-md object-cover"
            />
            <span className="font-semibold tracking-wide text-lg">
              TalisU&trade;
            </span>
          </Link>

          <nav className="flex flex-wrap gap-1.5 text-xs sm:text-sm justify-end">
            {TALISU_PRIMARY_NAV.map((item) => {
              const active = navActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1.5 transition ${
                    active
                      ? "bg-white text-neutral-950 font-medium"
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
          <div className="mx-auto max-w-6xl px-4 py-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-white/50 uppercase tracking-wider mr-1">
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
                      : "text-white/70 hover:text-white hover:bg-white/5"
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
