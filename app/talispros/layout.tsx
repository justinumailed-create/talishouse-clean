import type { Metadata, Viewport } from "next";
import "../globals.css";
import TalisprosLayoutClient from "@/components/talispros/TalisprosLayoutClient";
import { poppins } from "@/lib/fonts";
import { createMetadata } from "@/lib/seo";
import { talisprosBrandOgMetadataImage } from "@/lib/talispros/mapsite-og-image";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  ...createMetadata({
    title: "Tsplits™ | Claim your market",
    description:
      "Claim your market on Tsplits™. Mapsite pins your place on the map so buyers and partners can find you — Explore Talisbooks™ and grow your exposure worldwide.",
    path: "/talispros",
    image: talisprosBrandOgMetadataImage("Tsplits™ | Claim your market"),
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
