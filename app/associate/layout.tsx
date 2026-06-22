"use client";

import { redirect, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAssociate } from "@/context/AssociateContext";
import { useEffect } from "react";

export default function AssociateLayout({ children }: { children: React.ReactNode }) {
  const { authorized, role, loading: authLoading } = useAuth();
  const { associate, isLoading: associateLoading } = useAssociate();
  const pathname = usePathname();

  const isLoginPage = pathname === "/associate/login";

  useEffect(() => {
    if (authLoading || associateLoading) return;

    if (!authorized) {
      if (!isLoginPage) redirect("/associate/login");
      return;
    }

    if (role === "admin") {
      redirect("/admin/dashboard");
    }

    if (role === "associate" && isLoginPage) {
      redirect("/associate/dashboard");
    }
  }, [authorized, role, authLoading, associateLoading, isLoginPage]);

  if (authLoading || associateLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!authorized && !isLoginPage) {
    return null;
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-tight text-neutral-900">
              Associate Dashboard
            </span>
            {associate && (
              <span className="hidden sm:inline text-sm text-neutral-400">
                / {associate.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {associate && (
              <span className="text-xs font-mono bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                {associate.fastCode}
              </span>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
