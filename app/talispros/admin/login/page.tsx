"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAdminSession } from "@/lib/fast-code";
import { establishTalisprosAdminSession } from "@/app/talispros/admin/actions";

export default function TalisprosAdminLoginPage() {
  const [fastCode, setFastCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await establishTalisprosAdminSession(fastCode);
      if (!result.success) {
        setError(result.error || "Invalid FAST code");
        return;
      }

      setAdminSession();
      router.push("/talispros/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm px-6">
      <h1 className="text-2xl font-semibold text-center mb-2">
        Talispros™ Admin
      </h1>
      <p className="text-sm text-neutral-500 text-center mb-8">
        Manage MapSite pages and visitor subscriptions
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={fastCode}
          onChange={(e) => {
            setFastCode(e.target.value);
            setError("");
          }}
          className="w-full h-11 px-4 border border-neutral-200 rounded-xl text-center font-mono uppercase tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
          placeholder="FAST CODE"
          autoFocus
        />
        {error && (
          <p className="text-red-600 text-sm text-center">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
