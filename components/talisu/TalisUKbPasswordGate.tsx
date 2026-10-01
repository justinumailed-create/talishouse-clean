"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  buildTalisUKbUnlockHref,
  readTalisUKbUnlocked,
} from "@/lib/talisu/kb-gate";

/**
 * Protects /talisu/kb and manage routes.
 * Unlocked session → children. Locked → redirect to TalisU navbar unlock drop-pop.
 * Primary UX is the header popover; this gate is for direct URL hits.
 */
export default function TalisUKbPasswordGate({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() || "/talisu/kb";
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const ok = readTalisUKbUnlocked();
    setUnlocked(ok);
    setReady(true);
    if (!ok) {
      router.replace(buildTalisUKbUnlockHref(pathname));
    }
  }, [pathname, router]);

  if (!ready || !unlocked) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-sm items-center justify-center px-4">
        <p className="text-sm text-neutral-500">Opening unlock…</p>
      </div>
    );
  }

  return <>{children}</>;
}
