import { requireAdminScopePage } from "@/lib/admin-auth";

export default async function AdminProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminScopePage("platform-content");
  return children;
}
