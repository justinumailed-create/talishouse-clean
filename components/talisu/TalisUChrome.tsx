"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";
import { useT } from "@/lib/i18n/client";

export default function TalisUChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/talisu";
  const t = useT();
  const isMkts =
    pathname === "/talisu/mkts" || pathname.startsWith("/talisu/mkts/");

  // Markets: full-bleed Atlist-style shell (header + map). Do not alter
  // fit-bounds / pin sizing — only the shared blue header wraps the map app.
  if (isMkts) {
    return (
      <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-neutral-950 text-white">
        <TalisUMktsHeader />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    );
  }

  // All other /talisu routes: same blue header + light Atlist-parity surface.
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-100 text-neutral-900">
      <TalisUMktsHeader />
      <main className="flex-1">{children}</main>
      <footer className="shrink-0 border-t border-black/10 bg-white px-4 py-4 text-center text-[12px] leading-snug text-neutral-600 sm:px-6 sm:text-[13px]">
        <p>
          TalisU&trade; · {t.talisu.footerPartOf}{" "}
          <Link href="/" className="font-medium text-[#0069CF] hover:underline">
            Talispros&trade;
          </Link>
        </p>
      </footer>
    </div>
  );
}
