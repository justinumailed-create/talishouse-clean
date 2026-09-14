import { requireAdminScopePage } from "@/lib/admin-auth";

export default async function AdminFastCodesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminScopePage("fast-codes");
  return children;
}
