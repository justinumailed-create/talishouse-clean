import type { Metadata } from "next";
import { ADMIN_LOGIN_METADATA } from "@/lib/admin-seo";

export const metadata: Metadata = ADMIN_LOGIN_METADATA;
export const dynamic = "force-dynamic";

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
