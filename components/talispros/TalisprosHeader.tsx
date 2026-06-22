"use client";

import Link from "next/link";

export default function TalisprosHeader() {
  return (
    <nav className="flex-shrink-0 bg-white border-b border-neutral-200">
      <div className="max-w-5xl mx-auto px-6">
        <ul className="flex items-center justify-center gap-8 sm:gap-12 h-12 sm:h-14">
          {[
            { label: "Welcome", href: "/talispros", active: false },
            { label: "Claim a Market", href: "#" },
            { label: "Build a MapSite™", href: "/talispros/build-mapsite" },
            { label: "Register Account", href: "/talispros/register" },
          ].map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`text-xs sm:text-[13px] font-medium tracking-wide transition-colors ${item.active
                    ? "text-neutral-800"
                    : "text-neutral-400 hover:text-neutral-600"
                  }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
