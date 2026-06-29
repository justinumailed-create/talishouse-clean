"use client";

import { usePathname } from "next/navigation";
import TalisprosFooter from "./TalisprosFooter";
import TalisprosHeader from "./TalisprosHeader";

export default function TalisprosLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/talispros/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <TalisprosHeader />
      <main className="min-h-screen bg-white font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white [&:has(.mapsite-layout)]:p-0">
        {children}
      </main>
      <TalisprosFooter />
    </>
  );
}
