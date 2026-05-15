"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const ease = [0.25, 0.1, 0.25, 1] as const;

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease },
};

const staggerFadeUp = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, delay: i * 0.1, ease },
});

const howItWorks = [
  {
    title: "Receive Your Fast Code",
    text: "Fast Codes are issued directly by the Talishouse onboarding team.",
  },
  {
    title: "Access Your Dedicated MapSite",
    text: "Each partner receives a dedicated isolated onboarding environment.",
  },
  {
    title: "Launch & Manage Your Presence",
    text: "Manage listings, videos, leads, and outreach through your MapSite.",
  },
];

const workflowSteps = [
  { step: 1, title: "Partner Acquisition", text: "Tina acquires partner through outreach and evaluation." },
  { step: 2, title: "Fast Code Assigned", text: "A unique Fast Code is generated for the partner." },
  { step: 3, title: "MapSite Activated", text: "The dedicated MapSite environment is provisioned." },
  { step: 4, title: "Pins & Content Configured", text: "Initial content and location pins are set up." },
  { step: 5, title: "Partner Outreach Begins", text: "Partner starts using their MapSite for outreach." },
  { step: 6, title: "Lead Generation", text: "Real-time leads begin flowing to the partner dashboard." },
];

export default function PartnerAccessPage() {
  const router = useRouter();
  const [fastCode, setFastCode] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleFastCodeSubmit = (e: FormEvent) => {
    e.preventDefault();
    const code = fastCode.trim().toLowerCase();
    if (!code) return;
    setIsRedirecting(true);
    router.push(`/ttvaccess/${code}`);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      {/* SECTION 1 — HERO */}
      <section className="pt-24 pb-16 md:pt-40 md:pb-24 px-5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease }}
          >
            <h1 className="text-4xl md:text-6xl font-light tracking-tight mb-6">
              Wholesale Partner Access
            </h1>
            <p className="text-lg md:text-xl text-gray-500 font-light max-w-2xl mx-auto mb-12 leading-relaxed">
              Access your dedicated TalisTV MapSite using your assigned Fast Code.
            </p>

            <form onSubmit={handleFastCodeSubmit} className="max-w-md mx-auto mb-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={fastCode}
                  onChange={(e) => setFastCode(e.target.value)}
                  placeholder="Enter Fast Code"
                  disabled={isRedirecting}
                  className="flex-1 h-14 px-6 rounded-2xl border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isRedirecting || !fastCode.trim()}
                  className="h-14 px-8 bg-black text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {isRedirecting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Continue to MapSite
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <a 
              href="https://talisu.com/ob/claim/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-gray-900 transition-colors inline-flex items-center gap-1"
            >
              Request a Fast Code <ArrowRight className="w-3 h-3" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2 — HOW THE FLOW WORKS */}
      <section className="py-20 bg-[#fafafa] border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-5">
          <motion.div className="text-center mb-16" {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-light mb-4">How the Flow Works</h2>
            <p className="text-gray-500">A streamlined process for our wholesale partners.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item, i) => (
              <motion.div
                key={item.title}
                className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                {...staggerFadeUp(i)}
              >
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl font-light mb-6 group-hover:bg-black group-hover:text-white transition-colors">
                  0{i + 1}
                </div>
                <h3 className="text-xl font-medium mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm md:text-base">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — WORKFLOW OVERVIEW */}
      <section className="py-20 bg-white px-5">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-light mb-4">Workflow Overview</h2>
            <p className="text-gray-500">From initial contact to active lead generation.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 relative">
            {/* Visual connector line for desktop */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-px bg-gray-100 -z-10" />
            
            {workflowSteps.map((step, i) => (
              <motion.div
                key={step.title}
                className="relative bg-white"
                {...staggerFadeUp(i)}
              >
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                    {step.step}
                  </div>
                  <div>
                    <h4 className="font-medium text-lg mb-2">{step.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
