"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { TALISBOOKS_PRODUCT_NAME } from "@/lib/talisbooks/constants";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";

const NAV_ITEMS = [
  { label: "Dashboard", href: TALISBOOKS_ROUTES.DASHBOARD },
  { label: "Viewer", href: TALISBOOKS_ROUTES.VIEWER },
  { label: "Editor", href: TALISBOOKS_ROUTES.EDITOR },
  { label: "Settings", href: TALISBOOKS_ROUTES.SETTINGS },
];

export default function TalisBooksMarketingHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hideChrome =
    pathname.startsWith("/talisbooks/dashboard") ||
    pathname.startsWith("/talisbooks/editor") ||
    pathname.startsWith("/talisbooks/viewer");

  if (hideChrome) {
    return null;
  }

  return (
    <header className="shrink-0 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6 lg:px-8">
        <Link href={TALISBOOKS_ROUTES.HOME} className="group flex items-center gap-3 no-underline">
          <Image
            src="/logo.png"
            alt={TALISBOOKS_PRODUCT_NAME}
            width={32}
            height={32}
            className="h-7 w-7 object-contain"
            priority
          />
          <span className="text-[15px] font-semibold tracking-tight text-neutral-900 transition-colors group-hover:text-neutral-600">
            {TALISBOOKS_PRODUCT_NAME}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[14px] font-medium tracking-[0.3px] text-neutral-500 transition-colors duration-150 hover:text-neutral-900"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/talispros"
            className="text-[14px] font-medium tracking-[0.3px] text-neutral-400 transition-colors duration-150 hover:text-neutral-700"
          >
            Talispros™
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-neutral-100 bg-white px-6 pb-5 pt-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[14px] font-medium tracking-[0.3px] text-neutral-600 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-900"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/talispros"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-[14px] font-medium tracking-[0.3px] text-neutral-400 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-700"
            >
              Talispros™
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
