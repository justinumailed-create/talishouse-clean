"use client";

import { useState, useRef, FormEvent } from "react";
import Image from "next/image";

export default function PartnerAccessPage() {
  const [fastCode, setFastCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRedirect = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const normalized = fastCode
      .trim()
      .toLowerCase()
      .replace(/^\/+|\/+$/g, "");

    const isValid = /^[a-z0-9-]+$/.test(normalized);

    if (!normalized) {
      setError("Please enter a Fast Code");
      return;
    }

    if (!isValid) {
      setError("Invalid format. Only a-z, 0-9 and hyphens allowed.");
      return;
    }

    setIsSubmitting(true);
    const targetUrl = `https://talispros.com/ma/${normalized}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");

    setIsSubmitting(false);
    setFastCode("");
    inputRef.current?.focus();
  };

  return (
    <div className="font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <div className="mx-auto max-w-lg w-full px-5 py-4">
        <div className="text-center mb-4">
          <Image
            src="/logo.png"
            alt="TalisPros"
            width={150}
            height={40}
            className="h-10 md:h-[52px] w-auto object-contain mx-auto mb-3"
            priority
          />
          <h1 className="text-xl md:text-2xl font-light tracking-tight">Partner Access</h1>
          <p className="text-sm text-neutral-500 font-light mt-1">
            Access MapSites&trade; using Fast Codes
          </p>
        </div>

        <form onSubmit={handleRedirect} className="space-y-3">
          <div>
            <input
              ref={inputRef}
              type="text"
              value={fastCode}
              onChange={(e) => setFastCode(e.target.value)}
              placeholder="Enter Fast Code"
              disabled={isSubmitting}
              className="w-full h-12 px-4 bg-transparent border border-neutral-300 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all disabled:opacity-50"
              spellCheck={false}
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !fastCode.trim()}
            className="w-full h-12 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Access MapSite"
            )}
          </button>

          {error && (
            <p className="text-xs font-medium text-red-500 text-center">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
