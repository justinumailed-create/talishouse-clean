"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import TalisBotChat from "@/components/TalisBotChat";
import { shouldHidePublicStorefrontChrome } from "@/lib/admin-paths";
import { isProductCataloguePath } from "@/lib/product-flipbook/paths";

export default function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideStorefrontChrome = shouldHidePublicStorefrontChrome(pathname);
  const productCatalogue = isProductCataloguePath(pathname);
  const isEmbed =
    hideStorefrontChrome ||
    productCatalogue ||
    pathname === "/" ||
    pathname === "/start" ||
    pathname === "/learn-more" ||
    pathname.startsWith("/learn-more/") ||
    pathname.startsWith("/fast-code") ||
    pathname.startsWith("/partner-access") ||
    pathname.startsWith("/talispros") ||
    pathname.startsWith("/talisu") ||
    pathname.startsWith("/talismaps") ||
    pathname.startsWith("/talisbooks") ||
    pathname.startsWith("/talistv") ||
    pathname.startsWith("/associate/dashboard") ||
    pathname.startsWith("/associate/login") ||
    pathname.startsWith("/ma/") ||
    pathname.startsWith("/mapsite") ||
    pathname.startsWith("/crm/");
  const hideTalisBot =
    hideStorefrontChrome ||
    productCatalogue ||
    pathname === "/partner-access" ||
    pathname.startsWith("/talistv") ||
    /\/mapsite\/[^/]+\/map\/?$/.test(pathname);
  // Homepage stays embed (no Talishouse navbar/cart) but still shows Talisbot, bottom-left.
  const showHomeTalisBot = pathname === "/";

  if (isEmbed) {
    return (
      <>
        {children}
        {showHomeTalisBot && <TalisBotChat position="left" />}
      </>
    );
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
