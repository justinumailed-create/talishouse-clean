"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TALISU_SEACANS_NAV } from "@/lib/talisu/content";

/** In-page Sea-Cans tabs — does not replace the shared mkts header nav. */
export default function SeaCansLocalNav() {
  const pathname = usePathname() || "";

  return (
    <nav
      aria-label="Sea-Cans"
      className="mb-8 flex flex-wrap justify-center gap-2"
    >
      {TALISU_SEACANS_NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
              active
                ? "bg-[#0069CF] text-white"
                : "bg-white text-neutral-700 shadow-sm ring-1 ring-black/5 hover:bg-neutral-50"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
