import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/lib/seo";
import MarketingShell from "./MarketingShell";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = createMetadata({
  title: "Marketing Manager | Talispros™",
  description:
    "Internal portal for posting daily client marketing metrics, checklist updates, and campaign performance.",
  path: "/talispros/marketing",
  private: true,
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingShell>{children}</MarketingShell>;
}
