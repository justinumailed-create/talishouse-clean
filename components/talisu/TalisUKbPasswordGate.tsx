"use client";

import { useT } from "@/lib/i18n/client";
import { useEffect, useState, type ReactNode } from "react";
import {
  readTalisUKbUnlocked,
  requestTalisUKbNavbarUnlock,
  TALISU_KB_LOCKED_EVENT,
  TALISU_KB_UNLOCKED_EVENT,
} from "@/lib/talisu/kb-gate";
import TalisUKbUnlockForm from "@/components/talisu/TalisUKbUnlockForm";

/**
 * Protects /talisu/kb and manage routes.
 * Unlocked session → children.
 * Locked → stay on this URL; open the TalisU navbar unlock popover and show
 * an inline PayPal-style unlock card (never bounce to /talisu?kbUnlock=…).
 */
export default function TalisUKbPasswordGate({
  children,
}: {
  children: ReactNode;
}) {
  const h = useT().talisuHub;
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const ok = readTalisUKbUnlocked();
    setUnlocked(ok);
    setReady(true);
    if (!ok) {
      requestTalisUKbNavbarUnlock();
    }

    function onUnlocked() {
      setUnlocked(true);
    }
    function onLocked() {
      setUnlocked(false);
      requestTalisUKbNavbarUnlock();
    }
    window.addEventListener(TALISU_KB_UNLOCKED_EVENT, onUnlocked);
    window.addEventListener(TALISU_KB_LOCKED_EVENT, onLocked);
    return () => {
      window.removeEventListener(TALISU_KB_UNLOCKED_EVENT, onUnlocked);
      window.removeEventListener(TALISU_KB_LOCKED_EVENT, onLocked);
    };
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
            onSuccess={() => setUnlocked(true)}
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
