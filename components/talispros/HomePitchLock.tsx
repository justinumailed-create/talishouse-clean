"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PITCH_DONE_EVENT, readPitchDone } from "@/lib/talispros/pitch-gate";

/**
 * First-time visitors on the homepage. Signed-in owners and claimed FAST
 * Code visitors pass `exempt` and are never frozen.
 */
export default function HomePitchLock({
  exempt,
  children,
}: {
  exempt: boolean;
  children: ReactNode;
}) {
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (exempt) {
      setLocked(false);
      return;
    }
    const sync = () => setLocked(!readPitchDone(window.localStorage));
    sync();
    window.addEventListener(PITCH_DONE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PITCH_DONE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [exempt]);

  return (
    <div data-pitch-locked={locked ? "1" : "0"} data-testid="home-pitch" data-pitch-exempt={exempt ? "1" : "0"}>
      {children}
    </div>
  );
}
