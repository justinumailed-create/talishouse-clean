"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { establishClientAnalyticsSession } from "@/app/talispros/client/actions";
import { CLIENT_DASHBOARD_PATH } from "@/lib/mapsite-account-session";

export default function ClientLoginForm() {
  const [email, setEmail] = useState("");
  const [fastCode, setFastCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await establishClientAnalyticsSession(email, fastCode);
      if (!result.success) {
        setError(result.error || "Invalid email or FAST Code.");
        return;
      }

      router.push(CLIENT_DASHBOARD_PATH);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
          Client Analytics
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Sign in with your email and assigned FAST Code
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="you@example.com"
            className="w-full h-11 px-4 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-900 transition-colors"
            autoComplete="email"
            autoFocus
            disabled={loading}
            required
          />
        </div>

        <div>
          <label htmlFor="fastCode" className="block text-sm font-medium text-neutral-700 mb-1.5">
            FAST Code
          </label>
          <input
            id="fastCode"
            type="password"
            value={fastCode}
            onChange={(e) => {
              setFastCode(e.target.value);
              setError("");
            }}
            placeholder="e.g. LRG1"
            className="w-full h-11 px-4 bg-white border border-neutral-200 rounded-xl text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-neutral-900 transition-colors"
            autoComplete="current-password"
            disabled={loading}
            required
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
  );
}
