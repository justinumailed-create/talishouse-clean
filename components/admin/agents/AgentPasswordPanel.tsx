"use client";

import { useState, useTransition } from "react";
import { setAgentPasswordAction } from "@/app/admin/agents/actions";

/** Superadmin: set a chosen password or generate a temporary one (shown once). */
export default function AgentPasswordPanel({
  id,
  hasPassword,
  mustChangePassword,
  isLocked,
  lastLoginAt,
}: {
  id: string;
  hasPassword: boolean;
  mustChangePassword: boolean;
  isLocked: boolean;
  lastLoginAt: string | null;
}) {
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(chosen: string | null) {
    setError(null);
    setMessage(null);
    setShown(null);
    startTransition(async () => {
      const result = await setAgentPasswordAction(id, chosen);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPassword("");
      setShown(result.temporaryPassword);
      setMessage("Password set. The agent must change it at next login; other sessions were signed out.");
    });
  }

  return (
    <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-neutral-900">Login &amp; password</h2>
      <p className="text-sm text-neutral-600">
        {hasPassword ? "Password set" : "No password yet — the agent cannot sign in."}
        {mustChangePassword && hasPassword ? " · must change at next login" : ""}
        {isLocked ? " · temporarily locked after failed attempts (a reset unlocks)" : ""}
        {lastLoginAt ? ` · last login ${new Date(lastLoginAt).toLocaleString("en-US")}` : ""}
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-neutral-700">
          New password (min 12, upper/lower/digit)
          <input
            type="password"
            autoComplete="new-password"
            className="mt-1 block w-72 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={pending || password.length === 0}
          onClick={() => run(password)}
          className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Set password
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(null)}
          className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
        >
          Generate temporary password
        </button>
      </div>
      {shown ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Temporary password (shown once — copy it now): <code className="font-mono">{shown}</code>
        </p>
      ) : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
