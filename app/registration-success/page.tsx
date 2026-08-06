"use client";

// ⚠️ DEPRECATED — Target of /register-mapsite only. Use /talispros/register instead.
// Kept for backward compatibility; will be removed in a future release.

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, ExternalLink } from "lucide-react";

import { CLIENT_DASHBOARD_PATH } from "@/lib/mapsite-account-session";

function RegistrationSuccessContent() {
  const searchParams = useSearchParams();
  const fastCode = searchParams.get("fastCode") || "";
  const slug = searchParams.get("slug") || "";
  const url = searchParams.get("url") || CLIENT_DASHBOARD_PATH;
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown <= 0) {
      window.location.href = url;
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, url]);

  const fullUrl = `${window.location.origin}${url}`;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5 py-8">
      <div className="w-full max-w-lg text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-green-600" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight mb-3">
          Registration Successful
        </h1>
        <p className="text-neutral-500 text-sm sm:text-base mb-8 max-w-sm mx-auto">
          Your Mapsite™ has been created.
        </p>

        <div className="border border-neutral-200 rounded-2xl bg-white p-6 sm:p-8 text-left space-y-4">
          <div>
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-1">
              FAST Code
            </p>
            <p className="text-lg font-bold text-neutral-900">{fastCode}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-1">
              Mapsite™ URL
            </p>
            <a
              href={url}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium break-all flex items-center gap-1.5"
            >
              {fullUrl}
              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
            </a>
          </div>
        </div>

        <div className="mt-8 p-4 bg-neutral-50 rounded-xl">
          <p className="text-sm text-neutral-500">
            Redirecting to your marketing dashboard in <span className="font-bold text-neutral-900">{countdown}</span>...
          </p>
        </div>

        <div className="mt-6">
          <Link
            href={url}
            className="w-full h-12 bg-[#2563eb] text-white rounded-xl text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-[#1d4ed8] transition-all"
          >
            Go to Marketing Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegistrationSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" /></div>}>
      <RegistrationSuccessContent />
    </Suspense>
  );
}
