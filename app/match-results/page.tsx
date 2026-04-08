"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";

interface MatchResult {
  product: string;
  path: string;
  config: string;
  goal: string;
  timeline: string;
  homeType: string;
}

export default function MatchResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("matchResult");
    if (stored) {
      setResult(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading your results...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white/60 mb-4">No results found</div>
          <Link 
            href={ROUTES.FIND_YOUR_HOME}
            className="text-white hover:text-white/80 transition-colors"
          >
            Start matching →
          </Link>
        </div>
      </div>
    );
  }

  const goalLabels: Record<string, string> = {
    buy: "Home Buyer",
    build: "Building",
    invest: "Investor",
    explore: "Exploring"
  };

  const timelineLabels: Record<string, string> = {
    now: "Ready Now",
    soon: "Starting Soon",
    planning: "Planning Phase"
  };

  const homeTypeLabels: Record<string, string> = {
    glasshouse: "Glasshouse",
    talishouse_residential: "Talishouse Residential",
    talistowns: "TalisTowns",
    not_sure: "Open to Recommendations"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href={ROUTES.HOME} className="text-white/80 hover:text-white transition-colors text-sm">
          ← Back to Home
        </Link>
        <Link href={ROUTES.FIND_YOUR_HOME} className="text-white/80 hover:text-white transition-colors text-sm">
          Start Over →
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-3xl font-semibold text-white mb-2">
            Your Perfect Match
          </h1>
          <p className="text-white/60">
            Based on your preferences, here&apos;s what we recommend
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
          <div className="text-center mb-6">
            <div className="text-sm text-white/50 uppercase tracking-wider mb-2">
              Recommended Product
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              {result.product}
            </h2>
            <p className="text-white/70">
              {result.config}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
            <div className="text-center">
              <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Goal</div>
              <div className="text-white font-medium text-sm">
                {goalLabels[result.goal] || result.goal}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Timeline</div>
              <div className="text-white font-medium text-sm">
                {timelineLabels[result.timeline] || result.timeline}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Home Type</div>
              <div className="text-white font-medium text-sm">
                {homeTypeLabels[result.homeType] || result.homeType}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href={result.path}
            className="block w-full py-4 px-6 bg-white text-gray-900 rounded-xl font-medium text-center hover:bg-gray-100 transition-colors"
          >
            View {result.product}
          </Link>
          <Link
            href={ROUTES.BUSINESS_OFFICE}
            className="block w-full py-4 px-6 bg-white/10 text-white rounded-xl font-medium text-center hover:bg-white/20 transition-colors border border-white/20"
          >
            Talk to Advisor
          </Link>
          <button
            onClick={() => router.push(ROUTES.BUSINESS_OFFICE_PROPOSE_PROJECT)}
            className="block w-full py-4 px-6 bg-white/10 text-white rounded-xl font-medium text-center hover:bg-white/20 transition-colors border border-white/20"
          >
            Get Proposal
          </button>
        </div>

        <div className="mt-10 text-center">
          <p className="text-white/50 text-sm">
            Questions? Contact us at{" "}
            <a href="mailto:hello@talisu.com" className="text-white/70 hover:text-white">
              hello@talisu.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
