"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setAgentStatusAction } from "@/app/admin/agents/actions";

export default function AgentStatusButton({ id, status }: { id: string; status: "active" | "disabled" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const next = status === "active" ? "disabled" : "active";

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await setAgentStatusAction(id, next);
            if (!result.ok) setError(result.error);
            router.refresh();
          })
        }
        className={`rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
          status === "active"
            ? "border-red-200 text-red-600 hover:bg-red-50"
            : "border-green-200 text-green-700 hover:bg-green-50"
        }`}
      >
        {pending ? "…" : status === "active" ? "Disable" : "Enable"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </span>
  );
}
