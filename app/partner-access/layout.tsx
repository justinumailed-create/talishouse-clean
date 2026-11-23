import type { Viewport } from "next";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export async function generateMetadata() {
  return pageMetadata("/partner-access");
}

export default function PartnerAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
