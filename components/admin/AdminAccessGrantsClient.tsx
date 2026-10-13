"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { cardClass, fieldClass, primaryButton, secondaryButton, StatusPill } from "@/components/admin/ui";
import {
  ADMIN_GRANT_PERMISSIONS,
  ADMIN_GRANT_PERMISSION_LABELS,
  type AdminGrantPermission,
} from "@/lib/admin-constants";
import type { AdminAccessGrant, AdminAccessGrantEvent } from "@/lib/admin-access-grants";
import {
  createAdminGrantAction,
  revokeAdminGrantAction,
  updateAdminGrantAction,
} from "@/app/admin/access/actions";

function fmt(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function PermissionChecks({
  value,
  onChange,
  disabled,
}: {
  value: AdminGrantPermission[];
  onChange: (next: AdminGrantPermission[]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {ADMIN_GRANT_PERMISSIONS.map((p) => {
        const checked = value.includes(p);
        return (
          <label
            key={p}
            className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition ${
              checked ? "border-[#1E4ED8]/40 bg-[#1E4ED8]/5 text-neutral-900" : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#1E4ED8]"
              checked={checked}
              disabled={disabled}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? ADMIN_GRANT_PERMISSIONS.filter((x) => x === p || value.includes(x))
                    : value.filter((x) => x !== p),
                )
              }
            />
            {ADMIN_GRANT_PERMISSION_LABELS[p]}
          </label>
        );
      })}
    </div>
  );
}

function GrantRow({ grant }: { grant: AdminAccessGrant }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [perms, setPerms] = useState<AdminGrantPermission[]>(grant.permissions);
  const [name, setName] = useState(grant.displayName ?? "");
  const [email, setEmail] = useState(grant.email ?? "");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const revoked = Boolean(grant.revokedAt);

  function save() {
    setError("");
    start(async () => {
      const r = await updateAdminGrantAction({ id: grant.id, displayName: name, email, permissions: perms });
      if (!r.ok) setError(r.error || "Could not save.");
      else {
        setEditing(false);
        router.refresh();
      }
    });
  }
  function revoke() {
    if (!window.confirm(`Revoke admin access for ${grant.fastCode}?`)) return;
    start(async () => {
      const r = await revokeAdminGrantAction(grant.id);
      if (!r.ok) setError(r.error || "Could not revoke.");
      else router.refresh();
    });
  }

  return (
    <li className="px-5 py-4" data-testid="admin-grant-row">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-neutral-100 px-2 py-1 font-mono text-sm font-semibold text-neutral-900">{grant.fastCode}</span>
            <span className="text-sm font-medium text-neutral-900">{grant.displayName || "—"}</span>
            {revoked ? <StatusPill tone="neutral">Revoked</StatusPill> : <StatusPill tone="green">Active</StatusPill>}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Granted {fmt(grant.createdAt)} by {grant.grantedBy}
            {revoked ? ` · revoked ${fmt(grant.revokedAt)} by ${grant.revokedBy ?? "—"}` : ""}
          </p>
        </div>
        {revoked ? null : (
          <div className="flex gap-2">
            <button type="button" className={secondaryButton} onClick={() => setEditing((v) => !v)} disabled={pending}>
              {editing ? "Cancel" : "Edit"}
            </button>
            <button
              type="button"
              onClick={revoke}
              disabled={pending}
              className="inline-flex h-11 items-center rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Revoke
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" />
            <input className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" />
          </div>
          <PermissionChecks value={perms} onChange={setPerms} disabled={pending} />
          <button type="button" className={primaryButton} onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save permissions"}
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {grant.permissions.length === 0 ? (
            <span className="text-xs text-neutral-500">No sections (dashboard only)</span>
          ) : (
            grant.permissions.map((p) => (
              <span key={p} className="rounded-full bg-[#1E4ED8]/10 px-2.5 py-1 text-xs font-medium text-[#1E4ED8]">
                {ADMIN_GRANT_PERMISSION_LABELS[p]}
              </span>
            ))
          )}
        </div>
      )}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </li>
  );
}

export default function AdminAccessGrantsClient({
  grants,
  events,
}: {
  grants: AdminAccessGrant[];
  events: AdminAccessGrantEvent[];
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [perms, setPerms] = useState<AdminGrantPermission[]>([]);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const r = await createAdminGrantAction({ fastCode: code, displayName: name, email, permissions: perms });
      if (!r.ok) {
        setError(r.error || "Could not grant access.");
        return;
      }
      setCode("");
      setName("");
      setEmail("");
      setPerms([]);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className={`${cardClass} space-y-4 p-5 sm:p-6`} data-testid="admin-grant-form">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1E4ED8]/10 text-[#1E4ED8]">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Grant admin access</h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              The FAST Code signs in at /admin/login. Granted admins can never grant access to others.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <input className={`${fieldClass} font-mono uppercase`} value={code} onChange={(e) => setCode(e.target.value)} placeholder="FAST Code (e.g. RM22)" required disabled={pending} />
          <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" disabled={pending} />
          <input className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" disabled={pending} />
        </div>
        <PermissionChecks value={perms} onChange={setPerms} disabled={pending} />
        {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
        <button type="submit" className={primaryButton} disabled={pending}>
          {pending ? "Granting…" : "Grant access"}
        </button>
      </form>

      <section className={cardClass}>
        <h2 className="border-b border-neutral-200 px-5 py-4 text-base font-semibold text-neutral-900">Grants</h2>
        {grants.length === 0 ? (
          <p className="px-5 py-4 text-sm text-neutral-500">No admin access grants yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {grants.map((g) => (
              <GrantRow key={g.id} grant={g} />
            ))}
          </ul>
        )}
      </section>

      <section className={cardClass}>
        <h2 className="border-b border-neutral-200 px-5 py-4 text-base font-semibold text-neutral-900">Access log</h2>
        {events.length === 0 ? (
          <p className="px-5 py-4 text-sm text-neutral-500">No changes logged yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <span>
                  <span className="font-mono font-semibold">{e.fastCode}</span>{" "}
                  <span className="text-neutral-700">{e.action}</span>{" "}
                  <span className="text-neutral-500">by {e.actor}</span>
                </span>
                <span className="text-xs text-neutral-500">{fmt(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
