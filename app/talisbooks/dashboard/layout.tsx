import TalisBooksDashboardShell from "@/components/talisbooks/platform/TalisBooksDashboardShell";
import { adminMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return adminMetadata("Talisbooks™ Dashboard");
}

export default function TalisBooksDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TalisBooksDashboardShell>{children}</TalisBooksDashboardShell>;
}
