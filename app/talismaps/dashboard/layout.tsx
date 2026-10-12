import TalisMapsDashboardShell from "@/components/talismaps/platform/TalisMapsDashboardShell";
import { adminMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return adminMetadata("Talismaps™ Dashboard");
}

export default function TalisMapsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TalisMapsDashboardShell>{children}</TalisMapsDashboardShell>;
}
