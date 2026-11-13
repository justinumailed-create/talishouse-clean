"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Shows a bar the moment an in-app link is clicked. Route loading.tsx
 * skeletons cover the page body; this covers the gap before they paint,
 * including clicks that stay inside a layout that has no closer loading file.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setActive(false), 12000);
    return () => window.clearTimeout(timer);
  }, [active]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setActive(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!active) return null;

  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      aria-valuetext="Loading"
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-1 overflow-hidden bg-[#d6e8fa]"
    >
      <div className="nav-progress-bar h-full w-1/3 bg-[#046bd9]" />
    </div>
  );
}
