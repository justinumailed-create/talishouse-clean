import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/lib/seo";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = createMetadata({
  title: "Claim A Market™ | Talispros™",
  description:
    "Reserve and establish your target market before launching your Mapsite™ ecosystem.",
  path: "/talispros/claim-a-market",
});

export default function ClaimAMarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
