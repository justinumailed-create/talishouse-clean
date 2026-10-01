"use client";

import { useId, useState, type FormEvent } from "react";
import {
  isTalisUKbPassword,
  notifyTalisUKbUnlocked,
  writeTalisUKbUnlocked,
} from "@/lib/talisu/kb-gate";

export type TalisUKbUnlockFormProps = {
  /** Called after password succeeds and session unlock is stored. */
  onSuccess: () => void;
  /**
   * PayPal-style light floating card (navbar drop-pop + inline gate).
   * Dark navbar chrome was retired — unlock always uses the light card.
   */
  variant?: "navbar" | "inline";
  className?: string;
};

/**
 * Knowledge Base password form (Unlock).
 * Light floating card — same look in the TalisU navbar popover and on-page gate.
 */
export default function TalisUKbUnlockForm({
  onSuccess,
  variant = "navbar",
  className = "",
}: TalisUKbUnlockFormProps) {
  const titleId = useId();
  const fieldId = useId();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!isTalisUKbPassword(password)) {
      setError("Incorrect password. Try again.");
      return;
    }
    writeTalisUKbUnlocked();
    notifyTalisUKbUnlocked();
    onSuccess();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-4 ${className}`}
      aria-labelledby={titleId}
      data-variant={variant}
    >
      <div>
        <p
          id={titleId}
          className="text-[15px] font-semibold tracking-tight text-neutral-900"
        >
          Knowledge Base
        </p>
        <p className="mt-1 text-[13px] leading-snug text-neutral-500">
          Enter your password to unlock.
        </p>
      </div>
      <div>
        <label htmlFor={fieldId} className="sr-only">
          Password
        </label>
        <input
          id={fieldId}
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError("");
          }}
          className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3.5 text-[14px] text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-[#0070ba] focus:outline-none focus:ring-2 focus:ring-[#0070ba]/25"
          placeholder="Password"
          autoComplete="current-password"
          autoFocus
          required
        />
      </div>
      {error ? (
        <p className="text-[13px] text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#0070ba] text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#005ea6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0070ba]/40 focus-visible:ring-offset-2"
      >
        Unlock
      </button>
    </form>
  );
}
