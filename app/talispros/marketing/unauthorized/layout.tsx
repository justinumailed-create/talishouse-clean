import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Access Denied | Marketing Manager | Talispros™",
  description:
    "Your account is not authorized for the Talispros™ Marketing Manager portal.",
  path: "/talispros/marketing/unauthorized",
  private: true,
});

export default function MarketingUnauthorizedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
