import type { Viewport } from "next";
import MapSiteViewportLock from "@/components/talispros/mapsite/MapSiteViewportLock";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function MapLayout({
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
