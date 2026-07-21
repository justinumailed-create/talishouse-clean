"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { signOutMarketingManager } from "@/app/talispros/marketing/actions";
import {
  MARKETING_ADMIN_PATH,
  MARKETING_HOME_PATH,
  MARKETING_LOGIN_PATH,
  MARKETING_UNAUTHORIZED_PATH,
} from "@/lib/mapsite-account-session";

export default function MarketingShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isLoginPage = pathname === MARKETING_LOGIN_PATH;
  const isUnauthorizedPage = pathname === MARKETING_UNAUTHORIZED_PATH;

  if (isLoginPage || isUnauthorizedPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex">
      <aside className="w-56 shrink-0 border-r border-neutral-200 bg-white p-5 flex flex-col">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            TalisPros™
          </p>
          <h1 className="text-lg font-semibold text-neutral-900">Marketing</h1>
        </div>
        <nav className="space-y-1 flex-1">
          <Link
            href={MARKETING_ADMIN_PATH}
            className={`block rounded-lg px-3 py-2 text-sm ${
              pathname === MARKETING_ADMIN_PATH ||
              pathname.startsWith(`${MARKETING_ADMIN_PATH}/`)
                ? "bg-neutral-100 font-medium text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            Registrations
          </Link>
          <Link
            href={MARKETING_HOME_PATH}
            className={`block rounded-lg px-3 py-2 text-sm ${
              pathname === MARKETING_HOME_PATH ||
              pathname.startsWith(`${MARKETING_HOME_PATH}/clients`)
                ? "bg-neutral-100 font-medium text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            Clients
          </Link>
        </nav>
        <button
          type="button"
          disabled={isSigningOut}
          onClick={async () => {
            setIsSigningOut(true);
            await signOutMarketingManager();
            router.refresh();
          }}
          className="text-sm text-neutral-500 hover:text-neutral-900 text-left disabled:opacity-50"
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      </aside>
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
