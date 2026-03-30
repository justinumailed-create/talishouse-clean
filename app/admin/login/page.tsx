"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const SUPER_ADMIN_CODE = "ADMIN123";

export default function LoginPage() {
  const [fastCode, setFastCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!fastCode || fastCode.trim() === "") {
      setError("Enter FAST Code");
      return;
    }

    setLoading(true);

    try {
      const code = fastCode.trim().toUpperCase();

      // Super Admin login
      if (code === SUPER_ADMIN_CODE) {
        localStorage.setItem("role", "admin");
        localStorage.setItem("fastCode", code);
        window.location.href = "/admin/dashboard";
        return;
      }

      // Associate login (soft check)
      const { data: associate, error: supabaseError } = await supabase
        .from("associates")
        .select("*")
        .eq("fast_code", code)
        .maybeSingle();

      if (associate) {
        localStorage.setItem("role", "associate");
        localStorage.setItem("associateId", associate.id);
        localStorage.setItem("fastCode", code);
        
        // Redirect to associate portal or dashboard
        window.location.href = `/admin/dashboard`;
        return;
      }

      setError("FAST Code not found, try again");
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm px-6">
      <h1 className="text-2xl font-semibold text-center mb-8">Admin</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <input
            type="text"
            value={fastCode}
            onChange={(e) => {
              setFastCode(e.target.value);
              setError("");
            }}
            className={`input text-center text-xl tracking-widest font-mono ${
              error ? "border-red-500" : ""
            }`}
            placeholder="FAST Code"
            autoFocus
          />
          {error && (
            <p className="text-red-500 text-sm text-center font-medium">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? "Loading..." : "Continue"}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button 
          onClick={() => window.location.href = "/"}
          className="text-sm text-[#6e6e73] hover:text-[#111] transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
