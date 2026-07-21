"use client";

import { usePathname } from "next/navigation";
import TalisMapsMarketingHeader from "@/components/talismaps/platform/TalisMapsMarketingHeader";

export default function TalisMapsLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/talismaps/dashboard");
  const isEditor = pathname.startsWith("/talismaps/editor");

  if (isDashboard || isEditor) {
    return <>{children}</>;
  }

  return (
    <>
      <TalisMapsMarketingHeader />
      <main className="min-h-screen bg-white font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
        {children}
      </main>
    </>
  );
}
