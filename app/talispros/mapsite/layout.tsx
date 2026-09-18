import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/lib/seo";
import MapSiteViewportLock from "@/components/talispros/mapsite/MapSiteViewportLock";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = createMetadata({
  title: "Talispros™ Mapsite™",
  description:
    "Fullscreen Mapsite™ application for claiming markets and onboarding on Talispros™.",
  path: "/talispros/mapsite",
  image: false,
});

export default function MapSiteAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mapsite-app-shell h-dvh max-h-dvh w-screen overflow-hidden overscroll-none bg-neutral-900 text-neutral-900">
      <MapSiteViewportLock />
      {children}
    </div>
  );
}
