"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { agentChangePasswordAction, agentLoginAction } from "./actions";

const inputClass =
  "w-full h-11 px-4 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-900";

export function AgentLoginForm() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await agentLoginAction(loginId, password);
          if (!result.ok) {
            setError(result.error);
            setPassword("");
            return;
          }
          router.replace(result.next);
          router.refresh();
        });
      }}
    >
      <input
        className={inputClass}
        placeholder="Login ID"
        autoComplete="username"
        autoCapitalize="none"
        value={loginId}
        onChange={(e) => setLoginId(e.target.value)}
        required
        autoFocus
      />
      <input
        className={inputClass}
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full h-11 rounded-xl bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function AgentChangePasswordForm() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (next !== confirm) {
          setError("New passwords do not match.");
          return;
        }
        startTransition(async () => {
          const result = await agentChangePasswordAction(current, next);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.replace(result.next);
          router.refresh();
        });
      }}
    >
      <input className={inputClass} type="password" placeholder="Current (temporary) password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      <input className={inputClass} type="password" placeholder="New password (min 12, upper/lower/digit)" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />
      <input className={inputClass} type="password" placeholder="Confirm new password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full h-11 rounded-xl bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
