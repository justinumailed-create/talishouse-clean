"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { logoutAdminAction } from "@/app/admin/actions";
import { adminAccessLabel, adminHomePath, type AdminAccount } from "@/lib/admin-constants";
import { clearAdminSession } from "@/lib/fast-code";
import { accountCanAccessAdminPath } from "@/lib/admin-route-access";
import { AGENT_HEARTBEAT_MS } from "@/lib/agent-collab";
import { agentLoginPath, isAgentPortalPath } from "@/lib/agent-return-path";
import { getAdminNavItems, isAdminNavItemActive, type AdminNavItem } from "@/lib/admin-nav";
import { NAV_ICON, groupAdminNav } from "./admin-nav-groups";
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
  serverAccountIsAgent,
  roleLabel,
  chatUnread = 0,
}: {
  chatUnread?: number;
  isOpen: boolean;
  onClose: () => void;
  hidden: boolean;
  navItems: AdminNavItem[];
  signedInAs: string | null;
  serverAccountIsAgent: boolean;
  roleLabel: string;
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
          "fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 flex-col h-screen transform transition-transform duration-200 ease-in-out",
          hidden ? "hidden" : "flex",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="px-5 py-5 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1E4ED8] text-sm font-bold text-white">T</span>
            <div>
              <h1 className="text-[15px] font-semibold leading-tight tracking-tight text-neutral-900">Talispros™</h1>
              <p className="text-[10px] text-[#1E4ED8] font-bold uppercase tracking-widest mt-0.5">
                {serverAccountIsAgent ? "Agent Console" : "Admin Console"}
              </p>
            </div>
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

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groupAdminNav(navItems).map((group) => (
            <div key={group.title} className="mb-4">
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">{group.title}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isAdminNavItemActive(item.href, pathname);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                          active
                            ? "bg-[#1E4ED8]/10 font-semibold text-[#1E4ED8]"
                            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                        }`}
                      >
                        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                          <path d={NAV_ICON[item.href] ?? "M12 12h.01"} />
                        </svg>
                        <span className="flex flex-1 items-center justify-between gap-2">
                          {item.label}
                          {item.href === "/chat" && chatUnread > 0 ? (
                            <span className="rounded-full bg-[#1E4ED8] px-2 py-0.5 text-[11px] font-semibold text-white">{chatUnread}</span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-neutral-200 space-y-1">
          {signedInAs ? (
            <div className="mb-2 flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1E4ED8]/10 text-xs font-semibold text-[#1E4ED8]">
                {signedInAs.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-neutral-900">{signedInAs}</span>
                <span className="block text-[11px] text-neutral-500">{roleLabel}</span>
              </span>
            </div>
          ) : null}
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
  const [chatUnread, setChatUnread] = useState(0);
  const isAgent = serverAccount?.access === "agent" && !serverAccount.mustChangePassword;

  // Agent presence heartbeat (online dot / last seen) + chat unread badge.
  useEffect(() => {
    if (!isAgent) return;
    let alive = true;
    const beat = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/agent/heartbeat", { method: "POST", cache: "no-store" });
        if (res.ok && alive) setChatUnread(((await res.json()) as { unread?: number }).unread ?? 0);
      } catch {
        /* offline; next beat retries */
      }
    };
    void beat();
    const timer = window.setInterval(beat, AGENT_HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [isAgent]);

  const currentPath = pathname.split("?")[0].trim();
  const isLoginPage = isPublicAdminPath(currentPath);
  const isTalisMapsAdmin = isStandaloneAdminPath(currentPath);
  const isProtectedAdminRoute = isProtectedAdminPath(currentPath) && !isTalisMapsAdmin;
  const canAccessCurrentPath =
    !!serverAccount && accountCanAccessAdminPath(serverAccount, currentPath);

  useEffect(() => {
    if (isLoginPage && serverAccount) {
      router.replace(adminHomePath(serverAccount));
      return;
    }
    if (isProtectedAdminRoute && !serverAccount) {
      router.replace(isAgentPortalPath(currentPath) ? agentLoginPath(currentPath) : "/admin/login");
      return;
    }
    if (isProtectedAdminRoute && serverAccount && !canAccessCurrentPath) {
      router.replace(adminHomePath(serverAccount));
    }
  }, [
    canAccessCurrentPath,
    currentPath,
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

  const navItems = serverAccount ? getAdminNavItems(serverAccount) : [];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <div className="flex min-h-screen bg-white overflow-x-hidden">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          hidden={isLoginPage || !serverAccount}
          navItems={navItems}
          signedInAs={serverAccount?.name ?? null}
          serverAccountIsAgent={serverAccount?.access === "agent"}
          roleLabel={adminAccessLabel(serverAccount)}
          chatUnread={chatUnread}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <header
            className={[
              "border-b border-neutral-200 bg-white/90 backdrop-blur sticky top-0 z-30",
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
            <span className="text-sm font-medium text-gray-900">{serverAccount?.access === "agent" ? "Agent Console" : "Admin Console"}</span>
          </header>

          <main className={isLoginPage ? "flex-1" : "admin-main flex-1 bg-[#f6f8fb] px-4 py-6 lg:px-10 lg:py-10 overflow-y-auto pb-[120px]"}>
            <div className={isLoginPage ? "" : "max-w-6xl mx-auto"}>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
