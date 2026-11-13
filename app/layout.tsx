import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import NavigationProgress from "@/components/NavigationProgress";
import RootShell from "@/components/RootShell";
import { poppins } from "@/lib/fonts";
import { LocaleProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LOCALE_HTML_LANG } from "@/lib/i18n/config";

/** Supabase production is ca-central-1. Keep functions in Montreal (yul1). */
export const preferredRegion = "yul1";

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
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <LocaleProvider locale={locale}>
          <AuthProvider>
            <CartProvider>
              <RootShell>{children}</RootShell>
            </CartProvider>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
