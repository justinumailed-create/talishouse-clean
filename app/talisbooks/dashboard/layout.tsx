import TalisBooksDashboardShell from "@/components/talisbooks/platform/TalisBooksDashboardShell";

export default function TalisBooksDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TalisBooksDashboardShell>{children}</TalisBooksDashboardShell>;
}
