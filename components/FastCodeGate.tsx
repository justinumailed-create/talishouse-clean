"use client";

import { useState } from "react";
import { setFastCode, isSuperAdmin } from "@/lib/fast-code";
import { supabase } from "@/lib/supabase";

/**
 * FastCodeGate Component
 * Centered modal gate for FAST Code access control.
 */

export default function FastCodeGate() {
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const code = inputCode.trim().toUpperCase();
    if (!code) {
      setError("Please enter an access code");
      return;
    }

    setLoading(true);

    try {
      // 1. Check if it's Super Admin
      if (code === "ADMIN123") {
        setFastCode(code);
        localStorage.setItem("role", "admin");
        window.location.reload();
        return;
      }

      // 2. Check if it's a valid Associate code
      const { data: associate, error: dbError } = await supabase
        .from("associates")
        .select("*")
        .eq("fast_code", code)
        .maybeSingle();

      if (dbError) {
        console.error("Auth check error:", dbError);
        setError("An error occurred. Please try again.");
        setLoading(false);
        return;
      }

      if (associate) {
        setFastCode(code);
        localStorage.setItem("role", "associate");
        localStorage.setItem("associateId", associate.id);
        window.location.reload();
        return;
      }

      setError("Invalid access code. Please try again.");
    } catch (err) {
      console.error("Gate error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold tracking-tighter uppercase mb-2">TALISHOUSE&trade;</h2>
          <p className="text-sm text-[#6e6e73] tracking-[0.1em] uppercase">Business Office Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value);
                setError("");
              }}
              className="w-full bg-[#f5f5f7] border border-[#e5e5e5] rounded-xl px-4 py-4 text-center text-xl font-mono tracking-widest outline-none focus:border-[#1E4ED8] transition-all"
              placeholder="ENTER FAST CODE"
              autoFocus
              required
            />
            {error && (
              <p className="text-xs text-red-500 text-center font-medium animate-pulse">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Verifying..." : "Enter Dashboard"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="text-xs text-[#6e6e73] hover:text-black underline underline-offset-4"
          >
            Return to Talishouse Homepage
          </a>
        </div>
      </div>
    </div>
  );
}
