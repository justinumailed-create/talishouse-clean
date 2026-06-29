"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { clearAdminSession, hasAdminSession } from "@/lib/fast-code";

const navItems = [{ href: "/talispros/admin", label: "Overview" }];

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getSnapshot() {
  return hasAdminSession();
}

function getServerSnapshot() {
  return false;
}

export default function TalisprosAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const isLoginPage = pathname === "/talispros/admin/login";

  useEffect(() => {
    if (!isLoginPage && !isAuthenticated) {
      router.replace("/talispros/admin/login");
    }
  }, [isAuthenticated, isLoginPage, router]);

  if (!isLoginPage && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex">
      <aside className="w-56 shrink-0 border-r border-neutral-200 bg-white p-5 flex flex-col">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Talispros™
          </p>
          <h1 className="text-lg font-semibold text-neutral-900">Admin</h1>
        </div>
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm ${
                pathname === item.href ||
                (item.href.includes("/mapsites/") &&
                  pathname.startsWith("/talispros/admin/mapsites/"))
                  ? "bg-neutral-100 font-medium text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => {
            clearAdminSession();
            router.push("/talispros/admin/login");
          }}
          className="text-sm text-neutral-500 hover:text-neutral-900 text-left"
        >
          Sign out
        </button>
      </aside>
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
