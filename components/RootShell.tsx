"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import TalisBotChat from "@/components/TalisBotChat";
import { shouldHidePublicStorefrontChrome } from "@/lib/admin-paths";
import { isProductCataloguePath } from "@/lib/product-flipbook/paths";
import { isShortHomeFastCode } from "@/lib/talispros/fast-code-shape";
import { isHiddenBookshelfPath } from "@/lib/talisbooks/hidden-bookshelf-paths";

export default function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideStorefrontChrome = shouldHidePublicStorefrontChrome(pathname);
  const productCatalogue = isProductCataloguePath(pathname);
  const pathSegments = pathname.split("/").filter(Boolean);
  const isShortHomeLink =
    pathSegments.length === 1 && isShortHomeFastCode(pathSegments[0]);
  const isAppEntry = pathname === "/app" || pathname.startsWith("/app/");
  const isEmbed =
    hideStorefrontChrome ||
    productCatalogue ||
    pathname === "/" ||
    pathname === "/start" ||
    pathname === "/learn-more" ||
    pathname.startsWith("/learn-more/") ||
    pathname.startsWith("/fast-code") ||
    pathname.startsWith("/partner-access") ||
    pathname === "/demo" ||
    pathname === "/home-market" ||
    pathname === "/income-units" ||
    pathname.startsWith("/demo/") ||
    pathname === "/mapsites" ||
    pathname.startsWith("/mapsites/") ||
    pathname === "/webster" ||
    pathname.startsWith("/webster/") ||
    pathname === "/thorsten" ||
    pathname === "/aisha" ||
    pathname.startsWith("/home/") ||
    pathname === "/map" ||
    pathname.startsWith("/map/") ||
    pathname === "/markets" ||
    pathname.startsWith("/markets/") ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname === "/vision" ||
    pathname.startsWith("/talispros") ||
    pathname.startsWith("/talisu") ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname.startsWith("/talismaps") ||
    pathname.startsWith("/talisbooks") ||
    pathname.startsWith("/talistv") ||
    pathname.startsWith("/ma/") ||
    pathname.startsWith("/mapsite") ||
    pathname.startsWith("/crm/") ||
    isShortHomeLink ||
    isHiddenBookshelfPath(pathname) ||
    isAppEntry;
  const hideTalisBot =
    hideStorefrontChrome ||
    productCatalogue ||
    pathname === "/partner-access" ||
    pathname.startsWith("/talistv") ||
    /\/mapsite\/[^/]+\/map\/?$/.test(pathname);
  // Homepage stays embed (no Talishouse navbar/cart). Aisha's widget, mounted
  // by the gate page, replaces the floating TalisBOT launcher there.

  if (isEmbed) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="site-container">
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
      <CartDrawer />
      {!hideTalisBot && <TalisBotChat />}
    </>
  );
}
