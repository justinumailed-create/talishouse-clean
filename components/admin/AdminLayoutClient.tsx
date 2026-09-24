"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { logoutAdminAction } from "@/app/admin/actions";
import type { AdminAccount } from "@/lib/admin-constants";
import { clearAdminSession } from "@/lib/fast-code";
import { accountCanAccessAdminPath } from "@/lib/admin-route-access";
import { getAdminNavItems, isAdminNavItemActive, type AdminNavItem } from "@/lib/admin-nav";
import {
  isProtectedAdminPath,
  isPublicAdminPath,
  isStandaloneAdminPath,
} from "@/lib/admin-paths";

function AdminSidebar({
  isOpen,
  onClose,
  hidden,
  navItems,
  signedInAs,
}: {
  isOpen: boolean;
  onClose: () => void;
  hidden: boolean;
  navItems: AdminNavItem[];
  signedInAs: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAdminAction();
      clearAdminSession();
      router.replace("/admin/login");
      router.refresh();
    });
  };

  return (
    <>
      {isOpen && !hidden && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      <aside
        aria-hidden={hidden}
        className={[
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#e5e5e5] flex-col h-full transform transition-transform duration-200 ease-in-out",
          hidden ? "hidden" : "flex",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="p-6 border-b border-[#e5e5e5] flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight">Talispros™</h1>
            <p className="text-[10px] text-[#1E4ED8] font-bold uppercase tracking-widest mt-1">
              Admin Console
            </p>
            {signedInAs ? (
              <p className="text-[11px] text-[#6e6e73] mt-1">Signed in as {signedInAs}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`block px-3 py-2 rounded-lg text-sm transition-all ${
                    isAdminNavItemActive(item.href, pathname)
                      ? "bg-[#f5f5f7] text-[#111] font-semibold"
                      : "text-[#6e6e73] hover:text-[#111] hover:bg-[#f5f5f7]"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-3 border-t border-[#e5e5e5] space-y-1">
          <Link
            href="/catalog"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-[#6e6e73] hover:text-[#111] text-xs font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Talishouse™ site
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-[#6e6e73] hover:text-[#111] text-xs font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Talispros™ home
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

function AdminGatePlaceholder() {
  return <div className="min-h-screen bg-white" aria-hidden />;
}

export default function AdminLayoutClient({
  serverAccount,
  children,
}: {
  serverAccount: AdminAccount | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentPath = pathname.split("?")[0].trim();
  const isLoginPage = isPublicAdminPath(currentPath);
  const isTalisMapsAdmin = isStandaloneAdminPath(currentPath);
  const isProtectedAdminRoute = isProtectedAdminPath(currentPath) && !isTalisMapsAdmin;
  const canAccessCurrentPath =
    !!serverAccount && accountCanAccessAdminPath(serverAccount, currentPath);

  useEffect(() => {
    if (isLoginPage && serverAccount) {
      router.replace("/admin/dashboard");
      return;
    }
    if (isProtectedAdminRoute && !serverAccount) {
      router.replace("/admin/login");
      return;
    }
    if (isProtectedAdminRoute && serverAccount && !canAccessCurrentPath) {
      router.replace("/admin/dashboard");
    }
  }, [
    canAccessCurrentPath,
    isLoginPage,
    isProtectedAdminRoute,
    router,
    serverAccount,
  ]);

  // Fail closed: never paint Global Admin chrome or page data without a
  // server-confirmed FAST-code session. Unknown auth === no access.
  if (isProtectedAdminRoute && !serverAccount) {
    return <AdminGatePlaceholder />;
  }

  if (isProtectedAdminRoute && serverAccount && !canAccessCurrentPath) {
    return <AdminGatePlaceholder />;
  }

  if (isLoginPage && serverAccount) {
    return <AdminGatePlaceholder />;
  }

  if (isTalisMapsAdmin || isLoginPage) {
    return <>{children}</>;
  }

  const navItems = serverAccount ? getAdminNavItems(serverAccount.access) : [];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <div className="flex min-h-screen bg-white overflow-x-hidden">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          hidden={isLoginPage || !serverAccount}
          navItems={navItems}
          signedInAs={serverAccount?.name ?? null}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <header
            className={[
              "border-b border-[#e5e5e5] bg-white sticky top-0 z-30",
              isLoginPage || !serverAccount
                ? "hidden"
                : "lg:hidden flex items-center gap-4 p-4",
            ].join(" ")}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 -ml-2"
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-900">Admin Console</span>
          </header>

          <main className={isLoginPage ? "flex-1" : "flex-1 bg-[#f5f5f7] p-4 lg:p-8 overflow-y-auto pb-[120px]"}>
            <div className={isLoginPage ? "" : "max-w-5xl mx-auto"}>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
