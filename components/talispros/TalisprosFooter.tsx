"use client";

import { usePathname } from "next/navigation";

export default function TalisprosFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/talispros/mapsites/")) {
    return null;
  }

  return (
    <footer className="flex-shrink-0 bg-white border-t border-neutral-200 py-6 text-center">
      <p className="text-xs text-neutral-400">
        Powered by{" "}
        <a
          href="/talispros/forms"
          className="text-neutral-600 hover:text-neutral-900 underline underline-offset-2 transition-colors"
        >
          TalisForms™
        </a>
        <br />
        <span className="text-[10px] text-neutral-300">A Talispros™ Product</span>
      </p>
    </footer>
  );
}
