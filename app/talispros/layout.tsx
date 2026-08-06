import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "../globals.css";
import TalisprosLayoutClient from "@/components/talispros/TalisprosLayoutClient";
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
      "Build referral networks, co-promotion ecosystems, and industry-adjacent marketplaces using Mapsites™, FAST Codes™, TalisForms™, and Talismaps™.",
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
      <TalisprosLayoutClient>{children}</TalisprosLayoutClient>
    </div>
  );
}
