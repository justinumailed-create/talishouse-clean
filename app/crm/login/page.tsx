"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { setRole, Role } from "@/lib/permissions";

const VALID_ROLES: { code: string; role: Role; label: string }[] = [
  { code: "ADMIN", role: "admin", label: "Admin" },
  { code: "MANAGER", role: "manager", label: "Manager" },
  { code: "ASSOCIATE", role: "associate", label: "Associate" },
];

export default function CrmLoginPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalized = code.trim().toUpperCase();
      if (!normalized) {
        setError("Please enter your access code.");
        return;
      }

      const matched = VALID_ROLES.find((r) => r.code === normalized);
      if (matched) {
        setRole(matched.role);
        router.push("/crm");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("id, role, fast_code")
        .eq("fast_code", normalized)
        .eq("role", "associate")
        .maybeSingle();

      if (userData) {
        setRole("associate");
        if (typeof window !== "undefined") {
          localStorage.setItem("fast_code", normalized);
        }
        router.push("/crm");
        return;
      }

      setError("Invalid access code. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
            CRM Login
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Enter your access code to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Access code"
              className="w-full h-11 px-4 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-900 transition-colors uppercase tracking-wider text-center"
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
            className="w-full h-11 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wide hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-neutral-200">
          <p className="text-xs text-neutral-400 text-center mb-3">Demo access codes</p>
          <div className="space-y-1.5">
            {VALID_ROLES.map((r) => (
              <div key={r.role} className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">{r.label}</span>
                <code className="font-mono font-medium text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                  {r.code}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
