"use client";

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight,
  Zap, 
  ShieldCheck, 
  Smartphone, 
  Globe, 
  Building2,
  ChevronRight
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

// Background Patterns & Gradients Components
const BackgroundDecoration = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
    {/* Cinematic Radial Gradients */}
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
      className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-neutral-100 to-transparent blur-[120px]"
    />
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2, delay: 0.5 }}
      className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-gradient-to-tl from-neutral-100 to-transparent blur-[100px]"
    />

    {/* Subtle Grid Pattern */}
    <div 
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}
    />
  </div>
);

const featureHighlights = [
  "Dynamic Map Access",
  "Fast Code Routing",
  "Mobile Optimized",
  "Secure Launch",
  "Geospatial Experiences",
  "Enterprise Ready"
];

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

export default function PartnerAccessPage() {
  const [fastCode, setFastCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleRedirect = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedCode = fastCode.trim().toLowerCase();

    // Validation: lowercase alphanumeric + hyphen
    const isValid = /^[a-z0-9-]+$/.test(normalizedCode);

    if (!normalizedCode) {
      setError("Please enter a Fast Code");
      return;
    }

    if (!isValid) {
      setError("Invalid format. Only a-z, 0-9 and hyphens allowed.");
      return;
    }

    setIsSubmitting(true);
    // Dynamic redirect to TalisU ecosystem
    window.location.href = `https://talisu.com/ma/${normalizedCode}`;
  };

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white overflow-x-hidden">
      <BackgroundDecoration />

      {/* SECTION 1 — HERO & CENTERPIECE */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center justify-center overflow-hidden">
        <div className="max-w-4xl w-full text-center space-y-8 relative z-10">

          {/* Brand Label */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
          >
            <span className="text-[13px] font-semibold tracking-[0.3em] uppercase text-neutral-400">
              TalisU™
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
            className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.1]"
          >
            Wholesale Partner Access
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            className="text-lg md:text-xl text-neutral-500 font-light max-w-2xl mx-auto leading-relaxed"
          >
            Access dedicated TalisU™ MapSites™ using Fast Codes.
          </motion.p>

          {/* THE CENTERPIECE — INPUT */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease }}
            className="w-full max-w-2xl mx-auto pt-10"
          >
            <div className="relative group">
              {/* Cinematic Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-neutral-200 to-neutral-100 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

              <form 
                onSubmit={handleRedirect}
                className="relative flex flex-col sm:flex-row items-center gap-3 p-2 bg-white/70 backdrop-blur-3xl border border-neutral-100 rounded-[2.2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
              >
                <div className="flex-1 w-full relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-neutral-900 transition-colors">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <input
                    type="text"
                    value={fastCode}
                    onChange={(e) => setFastCode(e.target.value)}
                    placeholder="Enter Fast Code"
                    disabled={isSubmitting}
                    className="w-full h-16 pl-14 pr-6 bg-transparent text-xl font-light placeholder:text-neutral-300 focus:outline-none transition-all disabled:opacity-50"
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !fastCode.trim()}
                  className="w-full sm:w-auto h-16 px-10 bg-black text-white rounded-[1.8rem] font-medium text-sm tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50 whitespace-nowrap shadow-lg"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Access MapSite
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Validation/Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute left-6 -bottom-8 text-xs font-medium text-red-500"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* CTA */}
            <div className="mt-8 flex justify-center items-center gap-4 text-xs tracking-[0.2em] text-neutral-400 font-bold uppercase">
              <a 
                href="https://talisu.com/ob/claim/" 
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neutral-900 transition-colors flex items-center gap-2 group"
              >
                Request a Fast Code
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 1 — HOW THE FLOW WORKS */}
      <section className="py-24 bg-[#fafafa] border-y border-neutral-100/50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div className="text-center mb-16" {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-light mb-4">How the Flow Works</h2>
            <p className="text-neutral-500 font-light">A streamlined process for our wholesale partners.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {howItWorks.map((item, i) => (
              <motion.div
                key={item.title}
                className="bg-white p-10 rounded-[2.5rem] border border-neutral-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 group"
                {...staggerFadeUp(i)}
              >
                <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center text-xl font-bold text-neutral-900 mb-8 group-hover:bg-black group-hover:text-white transition-colors duration-500">
                  0{i + 1}
                </div>
                <h3 className="text-2xl font-bold mb-4 tracking-tight">{item.title}</h3>
                <p className="text-neutral-500 leading-relaxed font-light">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2 — WORKFLOW OVERVIEW */}
      <section className="py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div className="text-center mb-24" {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-light mb-4">Workflow Overview</h2>
            <p className="text-neutral-500 font-light">From initial contact to active lead generation.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-16 relative">
            {/* Visual connector line for desktop (optional, keeping it minimal) */}
            
            {workflowSteps.map((step, i) => (
              <motion.div
                key={step.title}
                className="relative"
                {...staggerFadeUp(i)}
              >
                <div className="flex items-start gap-8">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg shadow-lg">
                    {step.step}
                  </div>
                  <div className="pt-2">
                    <h4 className="font-bold text-xl mb-3 tracking-tight">{step.title}</h4>
                    <p className="text-neutral-500 font-light leading-relaxed max-w-md">{step.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — FEATURE STRIP */}
      <section className="py-12 border-y border-neutral-100 bg-neutral-50/30 overflow-hidden whitespace-nowrap">
        <div className="flex animate-marquee gap-12 items-center">
          {[...featureHighlights, ...featureHighlights].map((feat, i) => (
            <div key={i} className="flex items-center gap-4 px-4">
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
                {feat}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Styling for Marquee Animation */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
          width: fit-content;
        }
      `}</style>

      {/* FOOTER-ISH BRANDING */}
      <section className="py-24 text-center">
        <div className="max-w-xl mx-auto px-6">
          <p className="text-sm text-neutral-400 font-medium tracking-widest uppercase mb-8">
            Enterprise Ready Geospatial Logic
          </p>
          <div className="flex justify-center items-center gap-10 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
             <Building2 className="w-6 h-6" />
             <ShieldCheck className="w-6 h-6" />
             <Smartphone className="w-6 h-6" />
             <Globe className="w-6 h-6" />
          </div>
        </div>
      </section>
    </div>
  );
}
