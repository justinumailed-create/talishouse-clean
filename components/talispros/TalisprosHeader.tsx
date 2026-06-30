"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { label: "Welcome", href: "/talispros/welcome" },
  { label: "Claim A Market™", href: "/talispros/claim-a-market" },
  { label: "Build A MapSite™", href: "/talispros/build-mapsite" },
  { label: "Register Account", href: "/talispros/register" },
];

export default function TalisprosHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/talispros/mapsites/") || pathname === "/talispros/start") {
    return null;
  }

  return (
    <header className="flex-shrink-0 bg-white border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo + Brand */}
          <Link href="/talispros" className="flex items-center gap-3 no-underline group">
            <Image
              src="/logo.png"
              alt="TalisPros™"
              width={32}
              height={32}
              className="w-7 h-7 object-contain"
              priority
            />
            <span className="text-[15px] font-semibold tracking-tight text-neutral-900 group-hover:text-neutral-600 transition-colors">
              TalisPros™ PMC
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[14px] font-medium tracking-[0.3px] text-neutral-500 hover:text-neutral-900 transition-colors duration-150"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {open && (
        <div className="lg:hidden border-t border-neutral-100 bg-white px-6 pb-5 pt-3">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-lg text-[14px] font-medium tracking-[0.3px] text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors duration-150"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
