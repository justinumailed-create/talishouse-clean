import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/lib/seo";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = createMetadata({
  title: "Build A Mapsite™ | Talispros™",
  description:
    "Create a done-for-you Mapsite™ designed to connect referral partners, local businesses, and real estate professionals.",
  path: "/talispros/build-mapsite",
});

export default function BuildMapSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
