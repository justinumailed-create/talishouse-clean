"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import TalisBotChat from "@/components/TalisBotChat";

export default function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEmbed = pathname.startsWith("/fast-code");
  const hideTalisBot = pathname === "/partner-access";

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
