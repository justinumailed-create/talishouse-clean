import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { ExplanationSections, FSBO_BULLETS } from "../shared";

export default function FsboPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="text-center px-5 pt-20 sm:pt-28 pb-14 sm:pb-20">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">For Sale By Owner</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-neutral-900 mb-4">
            Sell Your Property Your Way
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 max-w-xl mx-auto leading-relaxed mb-8">
            Get market-ready with an AdPro™ placement. Reach motivated buyers
            directly through TalisMaps™ — no agent required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={"/talispros/register?plan=adpro"}
              className="inline-flex h-12 px-8 bg-neutral-900 text-white rounded-xl text-sm font-medium tracking-wide items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all"
            >
              Get Started With AdPro™
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#learn-more"
              className="inline-flex h-12 px-8 border border-neutral-300 text-neutral-700 rounded-xl text-sm font-medium tracking-wide items-center justify-center gap-2 hover:bg-neutral-50 active:scale-[0.98] transition-all"
            >
              Learn More
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <div id="learn-more">
        <ExplanationSections
          planLabel="Adpro PIN"
          price={49.95}
          bullets={FSBO_BULLETS}
          ctaHref="/talispros/register?plan=adpro"
          ctaLabel="Choose Adpro PIN"
        />
      </div>
    </div>
  );
}
