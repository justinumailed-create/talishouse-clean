import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AssociateProvider } from "@/context/AssociateContext";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingContactButton from "@/components/FloatingContactButton";
import CartDrawer from "@/components/CartDrawer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    "Modern homes and cottages starting from $58.50 per sq.ft. . Built in a day, move-in ready in a week. Lease-to-own options available.",
  keywords:
    "modular homes,cottages,prefab homes,tiny homes,affordable housing,lease to own homes",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} min-h-screen flex flex-col antialiased bg-white text-black font-sans`}
      >
        <AuthProvider>
          <CartProvider>
            <AssociateProvider>
              <Header />
              <main className="flex-grow page-wrapper container-main md:ml-[220px] mt-16 px-4 md:px-6">{children}</main>
              <Footer />
              <FloatingContactButton />
              <CartDrawer />
            </AssociateProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
