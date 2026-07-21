"use client";

import { usePathname } from "next/navigation";
import TalisBooksMarketingHeader from "@/components/talisbooks/platform/TalisBooksMarketingHeader";

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

  if (isDashboard || isLibrary || isEditor || isViewer) {
    return <>{children}</>;
  }

  return (
    <>
      <TalisBooksMarketingHeader />
      <main className="min-h-screen bg-white font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
        {children}
      </main>
    </>
  );
}
