"use client";

import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import {
  isTalisUKbPassword,
  TALISU_KB_UNLOCK_STORAGE_KEY,
} from "@/lib/talisu/kb-gate";
import { TALISU_CARD } from "@/lib/talisu/ui";

/**
 * Simple Knowledge Base password gate (matches admin-login card styling).
 * Unlocks for the browser session via sessionStorage.
 */
export default function TalisUKbPasswordGate({
  children,
}: {
  children: ReactNode;
}) {
  const titleId = useId();
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(TALISU_KB_UNLOCK_STORAGE_KEY);
      setUnlocked(stored === "1");
    } catch {
      setUnlocked(false);
    }
    setReady(true);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!isTalisUKbPassword(password)) {
      setError("Incorrect password. Try again.");
      return;
    }
    try {
      sessionStorage.setItem(TALISU_KB_UNLOCK_STORAGE_KEY, "1");
    } catch {
      // Still unlock for this page load if storage is unavailable.
    }
    setUnlocked(true);
  }

  if (!ready) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-sm items-center justify-center px-4">
        <p className="text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-sm items-center justify-center px-4 py-12">
      <div className={`${TALISU_CARD} w-full bg-white/95 px-6 py-8 backdrop-blur`}>
        <h1
          id={titleId}
          className="text-center text-2xl font-semibold text-neutral-950"
        >
          Knowledge Base
        </h1>
        <p className="mt-2 text-center text-sm text-neutral-500">
          Enter the password to unlock TalisU™ Knowledge Base guides.
        </p>
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4"
          aria-labelledby={titleId}
        >
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            className="h-11 w-full rounded-xl border border-neutral-200 px-4 text-center focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
            placeholder="Password"
            autoComplete="current-password"
            autoFocus
            required
          />
          {error ? (
            <p className="text-center text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            className="h-11 w-full rounded-xl bg-neutral-900 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
