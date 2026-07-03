import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Marketing Dashboard | Talispros™",
  description:
    "Track Facebook and Instagram impressions, reach, leads, and weekly marketing summaries for your MapSite™.",
  path: "/talispros/client/dashboard",
  private: true,
});

export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
