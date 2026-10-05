"use client";

import { usePathname } from "next/navigation";
import TalisUMktsHeader from "@/components/talisu/TalisUMktsHeader";

function talisbooksPathHasLibraryHeader(pathname: string): boolean {
  return (
    pathname === "/talisbooks" ||
    pathname.startsWith("/talisbooks/library") ||
    pathname === "/talisbooks/fast" ||
    pathname.startsWith("/talisbooks/fast/")
  );
}

/**
 * Product chrome for /talisbooks.
 * Shelf surfaces already mount TalisUMktsHeader inside TalisBooksLibraryShell.
 * Viewer, editor, dashboard, and remaining product pages share the same blue bar.
 */
export default function TalisBooksLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const isViewer = pathname.startsWith("/talisbooks/viewer");

  if (talisbooksPathHasLibraryHeader(pathname)) {
    return <>{children}</>;
  }

  return (
    <div
      className={
        isViewer
          ? "flex h-dvh min-h-dvh flex-col"
          : "flex min-h-dvh flex-col"
      }
    >
      <TalisUMktsHeader />
      {isViewer ? (
        <div className="min-h-0 flex-1">{children}</div>
      ) : (
        <main className="min-h-0 flex-1 bg-white font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
          {children}
        </main>
      )}
    </div>
  );
}
