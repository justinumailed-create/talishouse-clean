import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Marketing Manager Login | Talispros™",
  description:
    "Authorized Talispros™ staff sign-in for the marketing manager portal.",
  path: "/talispros/marketing/login",
  private: true,
});

export default function MarketingLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
