"use client";

import {
  clearTalisUKbUnlocked,
  notifyTalisUKbLocked,
  requestTalisUKbNavbarUnlock,
} from "@/lib/talisu/kb-gate";
import { useT } from "@/lib/i18n/client";

/**
 * Clear the Knowledge Base session unlock and return to the locked unlock UI
 * (inline PayPal-style card + navbar drop) without a full-page redirect.
 * Label/style aligned with claimed Mapsite owner Logout.
 */
export default function TalisUKbLogoutButton({
  className = "",
}: {
  className?: string;
}) {
  const h = useT().talisuHub;
  return (
    <button
      type="button"
      onClick={() => {
        clearTalisUKbUnlocked();
        notifyTalisUKbLocked();
        requestTalisUKbNavbarUnlock();
      }}
      className={
        className ||
        "rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-800 shadow-sm ring-1 ring-black/10 transition hover:bg-neutral-50"
      }
      aria-label={h.kbLogoutAria}
    >
      {h.kbLogout}
    </button>
  );
}
