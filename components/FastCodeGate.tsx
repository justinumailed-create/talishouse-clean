"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { isValidAdminFastCode, normalizeFastCode, setAdminSession } from "@/lib/fast-code";

export default function FastCodeGate() {
  const router = useRouter();
  const { login } = useAuth();
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const code = normalizeFastCode(inputCode);
    if (!code) {
      setError("Please enter an access code");
      return;
    }

    setLoading(true);

    try {
      if (isValidAdminFastCode(code)) {
        setAdminSession();
        login(code, "admin");
        localStorage.setItem("auth", "true");
        document.cookie = "auth=true; path=/; max-age=86400; SameSite=Lax";
        console.log("AUTH:", localStorage.getItem("auth"));
        // Auth flow → dashboard only
        router.replace("/business-office");
        return;
      }

      const { data: associate, error: dbError } = await supabase
        .from("associates")
        .select("*")
        .eq("fast_code", code)
        .maybeSingle();

      if (dbError) {
        console.warn("Associate lookup failed:", dbError.message);
      } else if (associate) {
        login(code, "associate", associate.id);
        localStorage.setItem("auth", "true");
        document.cookie = "auth=true; path=/; max-age=86400; SameSite=Lax";
        console.log("AUTH:", localStorage.getItem("auth"));
        // Auth flow → dashboard only
        router.replace("/business-office");
        return;
      }

      setError("Invalid access code. Please try again.");
    } catch (err: any) {
      console.warn("Gate error:", err?.message || err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-start justify-center overflow-y-auto">
      <div className="w-full max-w-sm px-6 py-16 md:py-24 mb-[120px]">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tighter uppercase mb-2">TALISHOUSE&trade;</h2>
          <p className="text-sm text-[#6e6e73] tracking-[0.1em] uppercase font-medium">Business Office Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  setError("");
                }}
                className={`w-full bg-[#f5f5f7] border ${error ? "border-red-500" : "border-[#e5e5e5]"} rounded-2xl px-4 py-5 text-center text-2xl font-mono font-bold tracking-[0.3em] outline-none focus:border-[#1E4ED8] transition-all`}
                placeholder="••••••••"
                autoFocus
                required
              />
            </div>
            {error && (
              <p className="text-xs text-red-500 text-center font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 font-medium">
            Enter your FAST code to continue
          </p>
        </form>

        <div className="mt-12 text-center pointer-events-auto">
          <button
            type="button"
            onClick={() => window.location.href = "/"}
            className="text-xs font-bold text-[#6e6e73] hover:text-black underline underline-offset-8 uppercase tracking-widest pointer-events-auto"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    </div>
  );
}
