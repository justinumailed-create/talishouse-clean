"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdminWithFastCodeAction } from "@/app/admin/actions";
import { normalizeFastCode, setAdminSession } from "@/lib/fast-code";

export default function AdminLoginForm() {
  const [fastCode, setFastCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedCode = normalizeFastCode(fastCode);
    if (!normalizedCode) {
      setError("Enter your FAST code");
      return;
    }

    setLoading(true);

    try {
      const result = await loginAdminWithFastCodeAction(normalizedCode);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setAdminSession(result.fastCode);
      router.replace("/admin/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div
        className="w-full rounded-2xl border border-neutral-200 bg-white px-6 py-8 shadow-sm"
        style={{ maxWidth: 384 }}
      >
        <h1 className="text-2xl font-semibold text-center mb-2">Admin Login</h1>
        <p className="text-sm text-[#6e6e73] text-center mb-8">
          Enter your authorized admin FAST code
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <input
              type="text"
              value={fastCode}
              onChange={(e) => {
                setFastCode(e.target.value);
                setError("");
              }}
              className={`w-full h-12 px-4 text-center font-mono uppercase tracking-[0.3em] border rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20 ${
                error ? "border-red-500" : "border-neutral-200"
              }`}
              placeholder="FAST CODE"
              autoCorrect="off"
              autoCapitalize="characters"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Loading..." : "Continue"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              router.push("/");
              router.refresh();
            }}
            className="text-sm text-[#6e6e73] hover:text-[#111] transition-colors"
          >
            Back to Talispros™
          </button>
        </div>
      </div>
    </main>
  );
}
