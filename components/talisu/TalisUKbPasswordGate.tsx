"use client";

import { useT } from "@/lib/i18n/client";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  readTalisUKbUnlocked,
  requestTalisUKbNavbarUnlock,
  TALISU_KB_LOCKED_EVENT,
  TALISU_KB_UNLOCKED_EVENT,
} from "@/lib/talisu/kb-gate";
import TalisUKbUnlockForm from "@/components/talisu/TalisUKbUnlockForm";

/**
 * Protects /talisu/kb and manage routes.
 * Everyone — visitors and signed-in owners, agents and admins alike — must
 * enter a valid FAST Code; a signed-in session no longer opens it directly.
 * The unlock lasts for this browser tab only (sessionStorage) → children.
 * Locked → stay on this URL; open the TalisU navbar unlock popover and show
 * an inline PayPal-style unlock card (never bounce to /talisu?kbUnlock=…).
 */
function subscribeKbUnlock(onChange: () => void) {
  window.addEventListener(TALISU_KB_UNLOCKED_EVENT, onChange);
  window.addEventListener(TALISU_KB_LOCKED_EVENT, onChange);
  return () => {
    window.removeEventListener(TALISU_KB_UNLOCKED_EVENT, onChange);
    window.removeEventListener(TALISU_KB_LOCKED_EVENT, onChange);
  };
}

export default function TalisUKbPasswordGate({
  children,
}: {
  children: ReactNode;
}) {
  const h = useT().talisuHub;
  // null on the server / first paint ("Checking…"); then this tab's unlock.
  // No session bypass: only a FAST Code unlock from this tab opens the KB.
  const stored = useSyncExternalStore(
    subscribeKbUnlock,
    () => readTalisUKbUnlocked(),
    () => null,
  );
  // Fallback when sessionStorage is blocked: unlocked for this page view only.
  const [unlockedHere, setUnlockedHere] = useState(false);
  const ready = stored !== null;
  const unlocked = stored === true || unlockedHere;

  useEffect(() => {
    if (stored === false && !unlockedHere) requestTalisUKbNavbarUnlock();
  }, [stored, unlockedHere]);

  useEffect(() => {
    // KB logout locks again even when the fallback unlocked this view.
    function onLocked() {
      setUnlockedHere(false);
    }
    window.addEventListener(TALISU_KB_LOCKED_EVENT, onLocked);
    return () => window.removeEventListener(TALISU_KB_LOCKED_EVENT, onLocked);
  }, []);

  if (!ready) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-sm items-center justify-center px-4">
        <p className="text-sm text-neutral-500">{h.kbChecking}</p>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-sm flex-col items-center justify-center px-4 py-10">
        <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <TalisUKbUnlockForm
            variant="inline"
            onSuccess={() => setUnlockedHere(true)}
          />
        </div>
        <p className="mt-4 text-center text-[12px] text-neutral-500">
          {h.kbUnlockHint}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
