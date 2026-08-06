"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setFastCode } from "@/lib/fast-code";
import { establishMapSiteOwnerSession } from "@/app/talispros/mapsites/actions";

export default function MapSiteEditGate({ fastCode }: { fastCode: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await establishMapSiteOwnerSession(fastCode, code);
      if (!result.success) {
        setError(result.error || "Unable to verify FAST code.");
        return;
      }

      setFastCode(fastCode);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-neutral-900 text-center mb-2">
          Edit Mapsite™
        </h1>
        <p className="text-sm text-neutral-500 text-center mb-8">
          Enter FAST code{" "}
          <span className="font-mono font-medium">{fastCode}</span> to edit this
          page.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            className="w-full h-11 px-4 border border-neutral-200 rounded-xl text-center font-mono uppercase tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
            placeholder="FAST CODE"
            autoFocus
          />
          {error ? (
            <p className="text-red-600 text-sm text-center">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
