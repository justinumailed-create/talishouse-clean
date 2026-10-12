"use client";

import { redirect, usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { getRole, getNavItems } from "@/lib/permissions";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const role = getRole();
  const navItems = getNavItems();

  if (!role) {
    redirect("/crm/login");
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#e5e5e5] flex-col h-full transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } flex`}
      >
        <div className="p-5 border-b border-[#e5e5e5]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-semibold tracking-tight">CRM</h1>
              <p className="text-[10px] text-[#1E4ED8] font-bold uppercase tracking-widest mt-0.5">
                Talishouse Internal
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
              {role}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/crm" && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-[#f5f5f7] text-[#111] font-semibold"
                        : "text-[#6e6e73] hover:text-[#111] hover:bg-[#f5f5f7]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 border-t border-[#e5e5e5] space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-[#6e6e73] hover:text-[#111] text-xs font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Site
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen lg:pl-64">
        <header className="border-b border-[#e5e5e5] bg-white sticky top-0 z-30 flex items-center gap-4 p-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:text-gray-900 -ml-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-900">CRM</span>
        </header>

        <main className="flex-1 bg-[#f5f5f7] p-4 lg:p-8 overflow-y-auto pb-[120px]">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
