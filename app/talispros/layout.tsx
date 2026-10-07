import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "../globals.css";
import TalisprosLayoutClient from "@/components/talispros/TalisprosLayoutClient";
import { createMetadata } from "@/lib/seo";
import { talisprosBrandOgMetadataImage } from "@/lib/talispros/mapsite-og-image";

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
    title: "Talispros™ | Claim your market",
    description:
      "Claim your market on Talispros™. Mapsite pins your place on the map so buyers and partners can find you — Explore Talisbooks™ and grow your exposure worldwide.",
    path: "/talispros",
    image: talisprosBrandOgMetadataImage("Talispros™ | Claim your market"),
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
