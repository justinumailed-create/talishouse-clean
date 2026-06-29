import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "../globals.css";
import TalisprosHeader from "@/components/talispros/TalisprosHeader";
import TalisprosFooter from "@/components/talispros/TalisprosFooter";
import { siteConfig, createMetadata } from "@/lib/seo";

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
  ...createMetadata({
    title: "Talispros™ | Industry Adjacent Market Places for Real Estate Professionals",
    description:
      "Build referral networks, co-promotion ecosystems, and industry-adjacent marketplaces using MapSites™, FAST Codes™, TalisForms™, and TalisMaps™.",
    path: "/talispros",
  }),
  icons: {
    icon: "/favicon-v2.ico",
    shortcut: "/favicon-v2.ico",
    apple: "/favicon-v2.png",
  },
};

export default function TalisprosLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={poppins.className}>
      <TalisprosHeader />
      <main className="min-h-screen bg-white font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white [&:has(.mapsite-layout)]:p-0">
        {children}
      </main>
      <TalisprosFooter />
    </div>
  );
}
