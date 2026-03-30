"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { isAuthorized, getRole, clearFastCode, isSuperAdmin } from "@/lib/fast-code";
import FastCodeGate from "@/components/FastCodeGate";

const adminNavItems = [
  { href: "/admin/dashboard", label: "Dashboard", superAdmin: false },
  { href: "/admin/leads", label: "Leads", superAdmin: false },
  { href: "/admin/leads-simulation", label: "Leads Simulation", superAdmin: true },
  { href: "/admin/deals", label: "Deals", superAdmin: false },
  { href: "/admin/users", label: "Users", superAdmin: true },
  { href: "/admin/applications", label: "Applications", superAdmin: false },
  { href: "/admin/associates", label: "Associates", superAdmin: true },
  { href: "/admin/pricing", label: "Pricing", superAdmin: true },
];

function AdminSidebar({ role, isOpen, onClose }: { role: string; isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const superAdmin = isSuperAdmin();

  const handleLogout = () => {
    clearFastCode();
    window.location.href = "/";
  };

  const filteredNavItems = adminNavItems.filter(item => {
    if (item.superAdmin && !superAdmin) return false;
    return true;
  });

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <div className={`w-56 bg-white border-r border-[#e5e5e5] flex flex-col h-screen sticky top-0 fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-[#e5e5e5] flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight">Talishouse</h1>
            <p className="text-[10px] text-[#1E4ED8] font-bold uppercase tracking-widest mt-1">
              {superAdmin ? "Super Admin" : "Associate Office"}
            </p>
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
            {filteredNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`block px-3 py-2 rounded-lg text-sm transition-all ${
                    pathname === item.href
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
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-[#6e6e73] hover:text-[#111] text-xs font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Site
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setAuthorized(isAuthorized());
    setRole(getRole());
  }, []);

  if (authorized === null) return null;

  if (!authorized) {
    return <FastCodeGate />;
  }

  return (
    <div className="flex min-h-screen bg-white">
      <AdminSidebar 
        role={role || "associate"} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col">
        <div className="lg:hidden flex items-center gap-4 p-4 bg-white border-b border-[#e5e5e5]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:text-gray-900"
            aria-label="Open sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-900">Admin Menu</span>
        </div>

        <main className="flex-1 bg-[#f5f5f7] p-4 lg:p-8 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
