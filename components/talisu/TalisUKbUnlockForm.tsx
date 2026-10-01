"use client";

import { useId, useState, type FormEvent } from "react";
import {
  isTalisUKbPassword,
  writeTalisUKbUnlocked,
} from "@/lib/talisu/kb-gate";

export type TalisUKbUnlockFormProps = {
  /** Called after password succeeds and session unlock is stored. */
  onSuccess: () => void;
  /**
   * `navbar`: dark blue drop-pop styling inside TalisU header menu.
   * `inline`: light card for rare fallbacks.
   */
  variant?: "navbar" | "inline";
  className?: string;
};

/**
 * Compact Knowledge Base password form (Unlock).
 * Primary UX: TalisU navbar drop-pop — not a full-page gate.
 */
export default function TalisUKbUnlockForm({
  onSuccess,
  variant = "navbar",
  className = "",
}: TalisUKbUnlockFormProps) {
  const titleId = useId();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const isNavbar = variant === "navbar";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!isTalisUKbPassword(password)) {
      setError("Incorrect password. Try again.");
      return;
    }
    writeTalisUKbUnlocked();
    onSuccess();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-3 ${className}`}
      aria-labelledby={titleId}
    >
      <div>
        <p
          id={titleId}
          className={`text-[13px] font-semibold ${
            isNavbar ? "text-white" : "text-neutral-950"
          }`}
        >
          Knowledge Base
        </p>
        <p
          className={`mt-1 text-[12px] leading-snug ${
            isNavbar ? "text-white/90" : "text-neutral-500"
          }`}
        >
          Enter the password to unlock.
        </p>
      </div>
      <input
        type="password"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          setError("");
        }}
        className={
          isNavbar
            ? "h-10 w-full rounded-md border border-white/25 bg-white/10 px-3 text-center text-[13px] text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            : "h-11 w-full rounded-xl border border-neutral-200 px-4 text-center focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
        }
        placeholder="Password"
        autoComplete="current-password"
        autoFocus
        required
      />
      {error ? (
        <p
          className={`text-center text-[12px] ${
            isNavbar ? "text-red-200" : "text-red-600"
          }`}
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className={
          isNavbar
            ? "inline-flex h-10 w-full items-center justify-center rounded-md bg-white text-[13px] font-semibold text-[#035bb8] transition hover:bg-white/95"
            : "h-11 w-full rounded-xl bg-neutral-900 text-sm font-medium text-white transition hover:bg-neutral-800"
        }
      >
        Unlock
      </button>
    </form>
  );
}
