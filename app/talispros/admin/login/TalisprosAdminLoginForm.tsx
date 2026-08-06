"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { establishTalisprosAdminSession } from "@/app/talispros/admin/actions";

export default function TalisprosAdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await establishTalisprosAdminSession(email, password);
      if (!result.success) {
        setError(result.error || "Invalid email or password");
        return;
      }

      router.push("/talispros/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm px-6">
      <div className="rounded-2xl border border-neutral-200 bg-white/95 shadow-sm backdrop-blur px-6 py-8">
        <h1 className="text-2xl font-semibold text-center mb-2">Talispros Admin</h1>
        <p className="text-sm text-neutral-500 text-center mb-8">
          Sign in to manage Mapsite™ pages and visitor subscriptions
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            className="w-full h-11 px-4 text-center border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
            placeholder="Email"
            autoComplete="email"
            autoFocus
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            className="w-full h-11 px-4 text-center border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
            placeholder="Password"
            autoComplete="current-password"
            required
          />
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
