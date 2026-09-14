import type { Metadata } from "next";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";
import { ADMIN_CONSOLE_METADATA } from "@/lib/admin-seo";

export const metadata: Metadata = ADMIN_CONSOLE_METADATA;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
