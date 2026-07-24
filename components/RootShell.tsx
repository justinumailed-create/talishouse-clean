"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import TalisBotChat from "@/components/TalisBotChat";

export default function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEmbed =
    pathname.startsWith("/fast-code") ||
    pathname.startsWith("/partner-access") ||
    pathname.startsWith("/talispros") ||
    pathname.startsWith("/talismaps") ||
    pathname.startsWith("/talisbooks") ||
    pathname.startsWith("/talistv") ||
    pathname.startsWith("/associate/dashboard") ||
    pathname.startsWith("/associate/login") ||
    pathname.startsWith("/ma/") ||
    pathname.startsWith("/crm/");
  const hideTalisBot = pathname === "/partner-access" || pathname.startsWith("/talistv");

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
