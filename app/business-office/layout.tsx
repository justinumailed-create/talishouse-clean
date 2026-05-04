"use client";

import { usePathname } from "next/navigation";

export const dynamic = "force-dynamic";

export default function BusinessOfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return <div key={pathname}>{children}</div>;
}
