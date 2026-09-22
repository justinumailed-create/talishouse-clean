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
    pathname.startsWith("/fast-code") ||
    pathname.startsWith("/partner-access") ||
    pathname.startsWith("/talispros") ||
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
