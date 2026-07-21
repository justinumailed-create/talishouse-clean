import TalisBooksDashboardShell from "@/components/talisbooks/platform/TalisBooksDashboardShell";

export default function TalisBooksLibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TalisBooksDashboardShell>{children}</TalisBooksDashboardShell>;
}
