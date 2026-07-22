"use client";

import { usePathname } from "next/navigation";
import TalisprosFooter from "./TalisprosFooter";
import TalisprosHeader from "./TalisprosHeader";

export default function TalisprosLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/talispros/admin");
  const isMapSiteApp =
    pathname === "/talispros/mapsite" || pathname?.startsWith("/talispros/mapsite/");

  if (isAdminRoute || isMapSiteApp) {
    return <>{children}</>;
  }

  const isFullBleedPage =
    pathname === "/talispros/start" || pathname.startsWith("/talispros/markets/");

  return (
    <>
      <TalisprosHeader />
      <main
        className={`bg-white font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white [&:has(.mapsite-layout)]:p-0 ${
          isFullBleedPage ? "h-dvh overflow-hidden" : "min-h-screen"
        }`}
      >
        {children}
      </main>
      <TalisprosFooter />
    </>
  );
}
