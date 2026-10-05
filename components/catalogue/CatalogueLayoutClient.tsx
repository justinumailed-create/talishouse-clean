"use client";

import { usePathname } from "next/navigation";
import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";

/**
 * Blue TalisU navbar on the T-All catalogue flipbook.
 * /catalogue/bookshelf (and create) already mount TalisUMktsHeader
 * via TalisBooksLibraryShell / the create page.
 */
export default function CatalogueLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  if (pathname.startsWith("/catalogue/bookshelf")) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-dvh min-h-dvh flex-col">
      <TalisUMktsHeader />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
