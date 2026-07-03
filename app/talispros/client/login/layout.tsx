import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Client Login | Talispros™",
  description:
    "Sign in with your email and FAST Code to access your read-only marketing analytics dashboard.",
  path: "/talispros/client/login",
});

export default function ClientLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
