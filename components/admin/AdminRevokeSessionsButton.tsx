"use client";

import { useState, useTransition } from "react";
import { cardClass, secondaryButton } from "@/components/admin/ui";
import { revokeAllOtherAdminSessionsAction } from "@/app/admin/access/actions";

/** Global Admin: revoke every other FAST-code admin session server-side. */
export default function AdminRevokeSessionsButton() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");

  function handleClick() {
    if (!window.confirm("Sign out every other admin session now? Your own session stays signed in.")) return;
    setMessage("");
    start(async () => {
      const result = await revokeAllOtherAdminSessionsAction().catch(() => ({
        ok: false as const,
        error: "Could not revoke admin sessions.",
        revoked: undefined,
      }));
      setMessage(
        result.ok
          ? `Signed out ${result.revoked ?? 0} other admin session${result.revoked === 1 ? "" : "s"}.`
          : result.error || "Could not revoke admin sessions.",
      );
    });
  }

  return (
    <section className={`${cardClass} flex flex-wrap items-center justify-between gap-3 px-5 py-4`}>
      <div>
        <h2 className="text-base font-semibold text-neutral-900">Admin sessions</h2>
        <p className="text-sm text-neutral-500">
          Sign out all other Global and granted admin sessions on every device.
        </p>
      </div>
      <div className="flex items-center gap-3">
        {message ? (
          <p role="status" className="text-sm text-neutral-600" data-testid="admin-revoke-sessions-status">
            {message}
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleClick}
          disabled={pending}
          className={secondaryButton}
          data-testid="admin-revoke-sessions"
        >
          {pending ? "Signing out…" : "Sign out all other admin sessions"}
        </button>
      </div>
    </section>
  );
}
