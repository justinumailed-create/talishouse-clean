"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isValidAdminFastCode, normalizeFastCode, setAdminSession } from "@/lib/fast-code";

export default function LoginPage() {
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
      if (!isValidAdminFastCode(normalizedCode)) {
        setError("Invalid FAST code");
        return;
      }

      setAdminSession();
      router.replace("/admin/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm px-6">
      <h1 className="text-2xl font-semibold text-center mb-8">Admin Login</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <input
            type="text"
            value={fastCode}
            onChange={(e) => {
              setFastCode(e.target.value);
              setError("");
            }}
            className={`input text-center font-mono uppercase tracking-[0.3em] ${error ? "border-red-500" : ""}`}
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
          onClick={() => router.replace("/")}
          className="text-sm text-[#6e6e73] hover:text-[#111] transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
