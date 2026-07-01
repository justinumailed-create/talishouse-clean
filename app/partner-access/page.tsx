"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import Image from "next/image";
import { buildMapsiteRedirectUrl } from "@/lib/registration-fast-code-routing";

export default function PartnerAccessPage() {
  useEffect(() => {
    document.documentElement.style.height = "auto";
    document.body.style.minHeight = "auto";
    document.body.style.backgroundColor = "#ffffff";
  }, []);
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
    const targetUrl = buildMapsiteRedirectUrl(normalized);
    if (window.self !== window.top) {
      window.top!.location.assign(targetUrl);
    } else {
      window.location.assign(targetUrl);
    }

    setIsSubmitting(false);
    setFastCode("");
    inputRef.current?.focus();
  };

  return (
    <div className="bg-white font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <div className="mx-auto max-w-lg w-full px-5 py-5">
        <div className="text-center mb-3">
          <Image
            src="/logo.png"
            alt="TalisPros™"
            width={150}
            height={40}
            className="h-9 w-auto object-contain mx-auto mb-2"
            priority
          />
          <h1 className="text-xl font-light tracking-tight">Partner Access</h1>
          <p className="text-sm text-neutral-500 font-light mt-0.5">
            Access MapSites&trade; using Fast Codes
          </p>
        </div>

        <form onSubmit={handleRedirect} className="space-y-2.5">
          <div>
            <input
              ref={inputRef}
              type="text"
              value={fastCode}
              onChange={(e) => setFastCode(e.target.value)}
              placeholder="Enter Fast Code"
              disabled={isSubmitting}
              className="w-full h-11 px-4 bg-transparent border border-neutral-300 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 transition-all disabled:opacity-50"
              spellCheck={false}
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !fastCode.trim()}
            className="w-full h-11 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50"
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
