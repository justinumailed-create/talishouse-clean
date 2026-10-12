"use client";

import { useT } from "@/lib/i18n/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function AssociateLoginPage() {
  const l = useT().login;
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalized = code.trim().toUpperCase();
      if (!normalized) {
        setError(l.associateEmpty);
        return;
      }

      const { data, error: lookupError } = await supabase
        .from("users")
        .select("id, name, role")
        .eq("fast_code", normalized)
        .eq("role", "associate")
        .maybeSingle();

      if (lookupError) throw lookupError;

      if (!data) {
        setError(l.associateInvalid);
        return;
      }

      login(normalized, "associate", data.id);
      router.push("/associate/dashboard");
    } catch (err) {
      console.error("Associate login error:", err);
      setError(l.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
            {l.associateTitle}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {l.associateSubtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fastCode" className="block text-sm font-medium text-neutral-700 mb-1.5">
              FAST Code
            </label>
            <input
              id="fastCode"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={l.associateCodePlaceholder}
              className="w-full h-11 px-4 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-900 transition-colors uppercase tracking-wider"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
              l.signIn
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
