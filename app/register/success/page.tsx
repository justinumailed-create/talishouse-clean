"use client";

// ⚠️ DEPRECATED — Use /talispros/register instead.
// Kept for backward compatibility; will be removed in a future release.

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { formatCAD } from "@/utils/currency";

function SuccessContent() {
  const searchParams = useSearchParams();
  const regNumber = searchParams.get("regNumber") || "";
  const accountType = searchParams.get("accountType") || "";
  const fastCode = searchParams.get("fastCode") || "";
  const amount = parseFloat(searchParams.get("amount") || "0");

  const accountLabel: Record<string, string> = {
    single: "Single AdPro™ PIN",
    "up-to-10": "Up To 10 AdPro™ PINs",
    "up-to-100": "Up To 100 AdPro™ PINs",
    unlimited: "Unlimited AdPro™ PINs",
  };

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
          Your MapSite™ account has been registered.
        </p>

        <div className="border border-neutral-200 rounded-2xl bg-white p-6 sm:p-8 text-left space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-1">
                Account Type
              </p>
              <p className="text-sm font-semibold text-neutral-900">
                {accountLabel[accountType] || accountType}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-1">
                FAST Code
              </p>
              <p className="text-sm font-semibold text-neutral-900 font-mono">
                {fastCode || "—"}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-1">
              Payment Amount
            </p>
            <p className="text-sm font-semibold text-neutral-900">
              {formatCAD(amount)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-1">
              Registration Number
            </p>
            <p className="text-sm font-semibold text-neutral-900 font-mono">
              {regNumber}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/ma/default"
            className="w-full h-12 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all"
          >
            Access My MapSite
          </Link>
        </div>

        <div className="mt-4">
          <Link
            href="/"
            className="text-sm text-neutral-400 hover:text-neutral-900 transition-colors underline underline-offset-2"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
