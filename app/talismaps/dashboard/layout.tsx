import TalisMapsDashboardShell from "@/components/talismaps/platform/TalisMapsDashboardShell";

export default function TalisMapsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TalisMapsDashboardShell>{children}</TalisMapsDashboardShell>;
}
