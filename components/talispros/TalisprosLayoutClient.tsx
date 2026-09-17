"use client";

import { usePathname } from "next/navigation";
import { isDemoMapSitePath } from "@/lib/talispros/demo-mapsite";
import { isTalisprosMarketLayoutPath } from "@/lib/talispros/market-pages";
import { isTalisprosStartPath } from "@/lib/talispros/start-content";
import TalisprosFooter from "./TalisprosFooter";
import TalisprosHeader from "./TalisprosHeader";

export default function TalisprosLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isEbookGenerate = pathname?.startsWith("/talispros/ebook-generate");
  const isDemoMapSite = isDemoMapSitePath(pathname);
  const isEbookLikePage = isEbookGenerate || isDemoMapSite;
  const isAdminRoute = pathname?.startsWith("/talispros/admin");
  const isMapSiteApp =
    pathname === "/talispros/mapsite" || pathname?.startsWith("/talispros/mapsite/");

  if (isAdminRoute || isMapSiteApp) {
    return <>{children}</>;
  }

  const isFullBleedPage =
    isTalisprosStartPath(pathname) || isTalisprosMarketLayoutPath(pathname);

  return (
    <>
      <TalisprosHeader />
      <main
        className={`font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white [&:has(.mapsite-layout)]:p-0 ${
          isEbookLikePage ? "bg-[#f5f5f7]" : "bg-white"
        } ${
          isFullBleedPage
            ? "min-h-dvh lg:h-dvh lg:overflow-hidden"
            : "min-h-screen"
        }`}
      >
        {children}
      </main>
      {isEbookLikePage ? null : <TalisprosFooter />}
    </>
  );
}
