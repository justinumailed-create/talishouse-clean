import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AssociateProvider } from "@/context/AssociateContext";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import TalisBotChat from "@/components/TalisBotChat";
import PageTransition from "@/components/PageTransition";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Talishouse | Homes & Cottages",
  description:
    "Modern homes and cottages starting from $58.50 per sq. ft.. Built in a day, move-in ready in a week. Lease-to-own options available.",
  keywords:
    "modular homes,cottages,prefab homes,tiny homes,affordable housing,lease to own homes",
  icons: {
    icon: "/favicon-v2.ico",
    shortcut: "/favicon-v2.ico",
    apple: "/favicon-v2.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <AuthProvider>
          <CartProvider>
            <AssociateProvider>
              <div className="site-container">
                <Header />
                <main>
                  <PageTransition>
                    {children}
                  </PageTransition>
                </main>
                <Footer />
              </div>
              <CartDrawer />
              <TalisBotChat />
            </AssociateProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
