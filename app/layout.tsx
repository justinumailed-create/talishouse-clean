import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AssociateProvider } from "@/context/AssociateContext";
import { AuthProvider } from "@/context/AuthContext";
import RootShell from "@/components/RootShell";
import { LocaleProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LOCALE_HTML_LANG } from "@/lib/i18n/config";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const ROOT_ICONS: Metadata["icons"] = {
  icon: "/favicon-v2.ico",
  shortcut: "/favicon-v2.ico",
  apple: "/favicon-v2.png",
};

export async function generateMetadata(): Promise<Metadata> {
  const d = getDictionary(await getLocale());
  return {
    metadataBase: new URL("https://www.talishouse.com"),
    title: d.meta.root.title,
    description: d.meta.root.description,
    keywords:
      "modular homes,cottages,prefab homes,tiny homes,affordable housing,lease to own homes",
    icons: ROOT_ICONS,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={LOCALE_HTML_LANG[locale]}>
      <body className={`${poppins.variable} ${poppins.className}`}>
        <LocaleProvider locale={locale}>
          <AuthProvider>
            <CartProvider>
              <AssociateProvider>
                <RootShell>{children}</RootShell>
              </AssociateProvider>
            </CartProvider>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
