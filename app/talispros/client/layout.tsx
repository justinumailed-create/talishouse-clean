import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/lib/seo";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = createMetadata({
  title: "Client Analytics | Talispros™",
  description:
    "Sign in to view your Mapsite™ marketing performance, weekly reports, and daily campaign updates.",
  path: "/talispros/client",
});

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
