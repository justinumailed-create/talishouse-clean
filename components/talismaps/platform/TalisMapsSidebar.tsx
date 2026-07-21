"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TALISMAPS_PRODUCT_NAME, TALISMAPS_SIDEBAR_ITEMS } from "@/lib/talismaps/constants";
import { TALISMAPS_ROUTES } from "@/lib/talismaps/routes";

function isActive(pathname: string, href: string) {
  if (href === TALISMAPS_ROUTES.DASHBOARD) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function TalisMapsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-neutral-200/80 bg-white/80 backdrop-blur-xl">
      <div className="border-b border-neutral-200/80 px-5 py-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Talispros™ Ecosystem
        </p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight text-neutral-900">
          {TALISMAPS_PRODUCT_NAME}
        </h1>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {TALISMAPS_SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-neutral-900 font-medium text-white shadow-sm"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.25 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200/80 px-5 py-4">
        <Link
          href={TALISMAPS_ROUTES.EDITOR}
          className="block rounded-xl bg-neutral-100 px-3 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200"
        >
          Open Editor
        </Link>
      </div>
    </aside>
  );
}
