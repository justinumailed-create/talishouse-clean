"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createAgentAction,
  updateAgentAction,
  type AgentActionResult,
} from "@/app/admin/agents/actions";
import { AGENT_GRANTABLE_SCOPES, AGENT_SCOPE_LABELS } from "@/lib/admin-constants";

export type AgentFormValues = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  loginId: string;
  status: "active" | "disabled";
  privileges: string[];
  assignedMapSites: string;
  regions: string;
  notes: string;
};

export const EMPTY_AGENT_FORM: AgentFormValues = {
  name: "",
  email: "",
  phone: "",
  loginId: "",
  status: "active",
  privileges: [],
  assignedMapSites: "",
  regions: "",
  notes: "",
};

function splitList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none";

export default function AgentForm({ initial }: { initial: AgentFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<AgentFormValues>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(initial.id);

  function set<K extends keyof AgentFormValues>(key: K, value: AgentFormValues[K]) {
    setSaved(false);
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function togglePrivilege(scope: string) {
    set(
      "privileges",
      values.privileges.includes(scope)
        ? values.privileges.filter((s) => s !== scope)
        : [...values.privileges, scope],
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      loginId: values.loginId,
      status: values.status,
      privileges: values.privileges,
      assignedMapSites: splitList(values.assignedMapSites),
      regions: splitList(values.regions),
      notes: values.notes,
    };
    startTransition(async () => {
      const result: AgentActionResult = initial.id
        ? await updateAgentAction(initial.id, payload)
        : await createAgentAction(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      if (!initial.id && result.id) {
        router.push(`/admin/agents/${result.id}`);
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-neutral-700">
          Name *
          <input className={inputClass} value={values.name} onChange={(e) => set("name", e.target.value)} required />
        </label>
        <label className="text-sm text-neutral-700">
          Login ID * <span className="text-xs text-neutral-400">(agent signs in at /agent/login)</span>
          <input
            className={`${inputClass} font-mono`}
            value={values.loginId}
            autoComplete="off"
            onChange={(e) => set("loginId", e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
            maxLength={32}
            required
          />
        </label>
        <label className="text-sm text-neutral-700">
          Email
          <input type="email" className={inputClass} value={values.email} onChange={(e) => set("email", e.target.value)} />
        </label>
        <label className="text-sm text-neutral-700">
          Phone
          <input className={inputClass} value={values.phone} onChange={(e) => set("phone", e.target.value)} />
        </label>
        <label className="text-sm text-neutral-700">
          Status
          <select
            className={inputClass}
            value={values.status}
            onChange={(e) => set("status", e.target.value === "disabled" ? "disabled" : "active")}
          >
            <option value="active">Active</option>
            <option value="disabled">Disabled (cannot log in)</option>
          </select>
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-neutral-900">Privileges</legend>
        <p className="text-xs text-neutral-500">
          My dashboard is always on. Agents can never manage agents, admins, FAST Codes, pricing or payments.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {AGENT_GRANTABLE_SCOPES.map((scope) => (
            <label key={scope} className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={values.privileges.includes(scope)}
                onChange={() => togglePrivilege(scope)}
              />
              {AGENT_SCOPE_LABELS[scope]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-neutral-700">
          Assigned Mapsites <span className="text-xs text-neutral-400">(FAST codes, comma or newline; empty = all, with Mapsites privilege)</span>
          <textarea
            className={`${inputClass} font-mono`}
            rows={3}
            value={values.assignedMapSites}
            onChange={(e) => set("assignedMapSites", e.target.value)}
          />
        </label>
        <label className="text-sm text-neutral-700">
          Regions <span className="text-xs text-neutral-400">(comma or newline)</span>
          <textarea className={inputClass} rows={3} value={values.regions} onChange={(e) => set("regions", e.target.value)} />
        </label>
      </div>

      <label className="block text-sm text-neutral-700">
        Internal notes
        <textarea className={inputClass} rows={2} value={values.notes} onChange={(e) => set("notes", e.target.value)} />
      </label>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {saved && isEdit ? <p className="text-sm text-green-700">Saved.</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : isEdit ? "Save agent" : "Create agent"}
      </button>
      {!isEdit ? (
        <p className="text-xs text-neutral-500">
          After creating, set a temporary password on the agent&apos;s page. They must change it at first login.
        </p>
      ) : null}
    </form>
  );
}
