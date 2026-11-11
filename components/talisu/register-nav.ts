"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  isRegisterDropdownItemActive,
  type RegisterDropdownMenuKey,
} from "@/lib/talisu/markets-pins";

/** Path, query and hash for Register-menu highlighting. Avoids useSearchParams. */
export function useRegisterNavLocation() {
  const pathname = usePathname() || "";
  const [search, setSearch] = useState("");
  const [hash, setHash] = useState("");

  useEffect(() => {
    const read = () => {
      setSearch(window.location.search || "");
      setHash(window.location.hash || "");
    };
    read();
    window.addEventListener("hashchange", read);
    window.addEventListener("popstate", read);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("popstate", read);
    };
  }, [pathname]);

  return { pathname, search, hash };
}

export function registerMenuLabel(
  t: Dictionary,
  menuKey: RegisterDropdownMenuKey,
): string {
  if (menuKey === "account") return t.nav.registerMenu.account;
  if (menuKey === "pin") return t.nav.registerMenu.pin;
  return t.nav.registerMenu.mapsite;
}

export function registerMenuItemActive(
  href: string,
  pathname: string,
  search: string,
  hash: string,
): boolean {
  return isRegisterDropdownItemActive(href, pathname, search, hash);
}
