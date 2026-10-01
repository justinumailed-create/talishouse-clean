"use client";

import { usePathname } from "next/navigation";
import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";
import { shouldShowTalisbooksMarketingHeader } from "@/lib/talisbooks/marketing-chrome";

/**
 * Product chrome for /talisbooks.
 * Shelf surfaces (public, FAST, library) render TalisUMktsHeader inside
 * TalisBooksLibraryShell. Remaining pages that still used the white
 * Talisbooks marketing bar now share the same blue TalisU navbar.
 * Dashboard / editor / viewer keep their own chrome (no duplicate blue bar).
 */
export default function TalisBooksLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/talisbooks/dashboard");
  const isLibrary = pathname.startsWith("/talisbooks/library");
  const isEditor = pathname.startsWith("/talisbooks/editor");
  const isViewer = pathname.startsWith("/talisbooks/viewer");
  // FAST + public shelves include the blue bar via LibraryShell.
  const isShelfSurface =
    pathname === "/talisbooks" ||
    pathname.startsWith("/talisbooks/fast/") ||
    pathname === "/talisbooks/fast";

  if (isDashboard || isLibrary || isEditor || isViewer || isShelfSurface) {
    return <>{children}</>;
  }

  return (
    <>
      {shouldShowTalisbooksMarketingHeader(pathname) ? (
        <TalisUMktsHeader />
      ) : null}
      <main className="min-h-screen bg-white font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
        {children}
      </main>
    </>
  );
}
