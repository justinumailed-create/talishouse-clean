import type { Viewport } from "next";
import { adminMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return adminMetadata("Client Analytics");
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
