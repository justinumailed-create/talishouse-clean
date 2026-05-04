"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatCAD } from "@/utils/currency";
import { supabase } from "@/lib/supabase";

const MapComponent = dynamic(() => import("@/components/MapComponent"), { ssr: false });

interface PageConfig {
  contentType: "map" | "pdf" | "image";
  contentUrl?: string;
  headline: string;
  subtext: string;
  ctaText: string;
  showForm: boolean;
  showVideo: boolean;
  videoUrl?: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface AssociateHeroProps {
  fastCode: string;
  pageConfig?: PageConfig;
}

const defaultConfig: PageConfig = {
  contentType: "map",
  contentUrl: "",
  headline: "TALISHOUSE™ HOMES",
  subtext: "Property discovery and modular home solutions.",
  ctaText: "Refer a Project",
  showForm: false,
  showVideo: false,
  videoUrl: "",
  name: "Associate",
  email: "",
  phone: ""
};

export default function AssociateHero({ fastCode, pageConfig }: AssociateHeroProps) {
  const config = pageConfig || defaultConfig;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "", location: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from("leads").insert([{
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        location: formData.location || "Associate Page",
        fast_code: fastCode,
        source: "associate_page",
        status: "new"
      }]);

      if (error) throw error;
      
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", message: "", location: "" });
      alert("Thank you! Your interest has been recorded.");
    } catch (err: any) {
      console.error("Lead submission failed:", err?.message || err);
      alert("Failed to submit. Please try again.");
    }

    setSubmitting(false);
  };

  const renderHeroContent = () => {
    if (config.contentType === "map") {
      return <div className="map-container" style={{ minHeight: '500px' }}><MapComponent associateId={fastCode} /></div>;
    }

    if (!config.contentUrl) {
      return (
        <div className="w-full h-full bg-[#fcfcfc] flex flex-col items-center justify-center text-neutral-400 rounded-2xl p-10 text-center border-2 border-dashed border-neutral-100">
          <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium">Content Area</p>
          <p className="text-xs mt-1">Asset will appear here</p>
        </div>
      );
    }

    switch (config.contentType) {
      case "image":
        return (
          <div className="map-container" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <iframe
              src="https://my.atlist.com/map/dd00462f-d929-4aac-a777-32017c2523b1?share=true"
              style={{ border: 'none', flex: 1, width: '100%', height: '100%' }}
              loading="lazy"
              title="Property Map"
            />
          </div>
        );
      case "pdf":
        return (
          <iframe 
            src={config.contentUrl} 
            className="map-container"
            style={{ minHeight: '500px' }}
            title="Project Document" 
          />
        );
      default:
        return <div className="map-container" style={{ minHeight: '500px' }}><MapComponent associateId={fastCode} /></div>;
    }
  };

  const renderMediaArea = () => {
    return (
      <div className="relative w-full h-full">
        <img 
          src="/images/mapsite-bottom-right.jpg" 
          alt="Affiliate Media"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '12px'
          }}
        />
        <div 
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#fff',
            maxWidth: '70%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          Your file type can be YouTube, PDF or JPG / PNG.
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f8f7] py-10 md:py-16 px-4 md:px-8">
      <div className="max-w-[1500px] mx-auto">
        {/* Associate Demo Frame Label */}
        <div className="mb-4 flex items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
              Associate Mapsite™ Preview
            </span>
          </div>
          <div className="hidden sm:block">
            <span className="text-[10px] font-medium text-neutral-400 bg-neutral-100 px-2 py-1 rounded-full uppercase tracking-wider">
              Live Preview
            </span>
          </div>
        </div>

        {/* Premium Framed Container */}
        <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-neutral-200 shadow-md overflow-hidden flex flex-col">
          <Header />
          
          <main className="flex-1 w-full px-5 py-6">
            <div className="flex flex-col lg:grid lg:grid-cols-[7fr_3fr] gap-6 items-stretch h-full">

              {/* LEFT 70% - Associate Selected Content */}
              <div className="flex flex-col gap-4" style={{ minHeight: '500px' }}>
                <div className="flex-1 bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden shadow-sm" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '420px' }}>
                  {renderHeroContent()}
                </div>
                
                {/* Headline/Subtext Overlay styled like HomeHero */}
                <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 shadow-sm">
                  <p className="text-[10px] tracking-[0.2em] text-neutral-400 uppercase mb-2">
                    Affiliate Mapsite™
                  </p>
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-900 mb-2">
                    Demo Sample
                  </h2>
                  <p className="section-description">
                    Opt in to qualify for our premium marketing tools, including a Mapsite™. 
                    "Moonlight" towards a more rewarding lifestyle, or start a sideline to complement your primary business interests.
                  </p>
                </div>
              </div>

              {/* RIGHT 30% - Lead Form & Media */}
              <div className="flex flex-col gap-6">
                
                {/* Top Half: Lead Acquisition Form */}
                <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 shadow-sm flex flex-col gap-4">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">Get in Touch</h3>
                    <p className="text-xs text-neutral-500">Submit your interest for this project.</p>
                  </div>
                  <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Full Name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] text-sm focus:outline-none focus:border-black transition-colors"
                      />
                      <input
                        type="email"
                        placeholder="Email Address"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] text-sm focus:outline-none focus:border-black transition-colors"
                      />
                    </div>
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] text-sm focus:outline-none focus:border-black transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Location / Address"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] text-sm focus:outline-none focus:border-black transition-colors"
                    />
                    <textarea
                      placeholder="Tell us about your project"
                      required
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#e5e5e5] text-sm focus:outline-none focus:border-black transition-colors resize-none"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-black text-white text-sm font-medium rounded-full hover:bg-neutral-800 transition-all disabled:opacity-50 shadow-sm"
                    >
                      {submitting ? "Submitting..." : config.ctaText || "Refer a Project"}
                    </button>
                  </form>
                </div>

                {/* Bottom Half: Media Area */}
                <div className="flex-1 min-h-[300px] bg-white rounded-2xl border border-[#e5e5e5] overflow-hidden shadow-sm p-2">
                  <div className="w-full h-full">
                    {renderMediaArea()}
                  </div>
                </div>

              </div>

            </div>
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );

}
