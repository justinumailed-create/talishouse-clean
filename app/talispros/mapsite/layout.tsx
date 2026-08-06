import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/lib/seo";

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
});

export default function MapSiteAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-dvh w-screen overflow-hidden bg-neutral-900 text-neutral-900">
      {children}
    </div>
  );
}
