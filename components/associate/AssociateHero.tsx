"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const MapComponent = dynamic(() => import("@/components/MapComponent"), { ssr: false });

interface PageConfig {
  heroType: "map" | "image" | "gallery" | "pdf" | "video";
  heroContent: string | string[];
  headline: string;
  subtext: string;
  ctaText: string;
  showForm: boolean;
  showVideo: boolean;
  videoUrl?: string;
}

interface AssociateHeroProps {
  fastCode: string;
  pageConfig?: PageConfig;
}

const defaultConfig: PageConfig = {
  heroType: "map",
  heroContent: "",
  headline: "TALISHOUSE™ HOMES",
  subtext: "",
  ctaText: "Propose a Project",
  showForm: false,
  showVideo: false,
  videoUrl: ""
};

export default function AssociateHero({ fastCode, pageConfig }: AssociateHeroProps) {
  const config = pageConfig || defaultConfig;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [formData, setFormData] = useState({ message: "", location: "" });
  const [submitting, setSubmitting] = useState(false);

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
      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fastCode,
          message: formData.message,
          location: formData.location
        })
      });

      const data = await res.json();
      if (data.success) {
        alert("Project submitted successfully!");
        setFormData({ message: "", location: "" });
      }
    } catch (err) {
      console.error("Form submit error:", err);
    }

    setSubmitting(false);
  };

  const renderHeroContent = () => {
    switch (config.heroType) {
      case "map":
        return <MapComponent associateId={fastCode} />;
      case "image":
        return config.heroContent ? (
          <img src={config.heroContent as string} alt="Hero" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No image set</div>
        );
      case "gallery":
        const images = typeof config.heroContent === "string" 
          ? config.heroContent.split(",").filter(Boolean)
          : (config.heroContent as string[]) || [];
        return (
          <div className="grid grid-cols-2 gap-2 h-full">
            {images.length > 0 ? images.slice(0, 4).map((img, i) => (
              <img key={i} src={img.trim()} alt={`Gallery ${i}`} className="w-full h-full object-cover rounded" />
            )) : (
              <div className="col-span-2 bg-gray-200 flex items-center justify-center text-gray-400">No gallery images</div>
            )}
          </div>
        );
      case "pdf":
        return config.heroContent ? (
          <iframe src={config.heroContent as string} className="w-full h-full" title="PDF Document" />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No PDF set</div>
        );
      case "video":
        return config.heroContent ? (
          <video src={config.heroContent as string} controls className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No video set</div>
        );
      default:
        return <MapComponent associateId={fastCode} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch w-full">
          {/* LEFT 70% - Hero Content */}
          <div className="lg:col-span-2 h-full">
            <div className="w-full h-full min-h-[400px] lg:min-h-[500px] rounded-xl overflow-hidden bg-gray-200">
              {renderHeroContent()}
            </div>
          </div>

          {/* RIGHT 30% - CTA Section */}
          <div className="lg:col-span-1 flex flex-col h-full">
            <div className="flex-shrink-0 bg-white border rounded-xl p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-[#444] mb-4 font-bold">
                Global Overview
              </p>

              <h1 className="leading-tight mb-6">
                <span className="block text-2xl md:text-3xl font-extrabold tracking-[0.15em] uppercase text-gray-900">
                  {config.headline || "TALISHOUSE™"}
                </span>
                <span className="block text-sm md:text-base font-light tracking-[0.3em] uppercase text-gray-500">
                  {config.subtext || "Homes and Cottages"}
                </span>
              </h1>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start text-base font-medium text-gray-800">
                  <span className="mr-3 text-gray-900 font-bold">•</span>
                  <span>From $58.50 per sq.ft.</span>
                </li>
                <li className="flex items-start text-base font-medium text-gray-800">
                  <span className="mr-3 text-gray-900 font-bold">•</span>
                  <span>Typically up in a day and move in ready in a week</span>
                </li>
                <li className="flex items-start text-base font-medium text-gray-800">
                  <span className="mr-3 text-gray-900 font-bold">•</span>
                  <span>Lease-To-Own terms available, OAC</span>
                </li>
              </ul>

              <Link
                href={`/propose-project?fast=${fastCode}`}
                className="block w-full text-center text-base font-medium text-white bg-black hover:bg-[#2b2b2b] rounded-lg px-6 py-4 transition-colors"
                style={{ backgroundColor: '#000000', color: '#ffffff' }}
              >
                {config.ctaText || "Propose a Project"}
              </Link>
            </div>

            {/* Optional Form */}
            {config.showForm && (
              <div className="flex-shrink-0 bg-white border rounded-xl p-6 shadow-sm mt-4">
                <h3 className="font-semibold mb-4">Start Your Project</h3>
                <form onSubmit={handleFormSubmit} className="space-y-3">
                  <textarea
                    placeholder="Describe your project..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-black"
                    rows={3}
                  />
                  <input
                    placeholder="Location / Address"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-black"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-[#2b2b2b] transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </form>
              </div>
            )}

            {/* Optional Video */}
            {config.showVideo && config.videoUrl && (
              <div className="flex-1 relative bg-black rounded-xl overflow-hidden mt-4">
                <iframe 
                  src={config.videoUrl} 
                  className="w-full h-full absolute inset-0" 
                  allowFullScreen
                  title="Promo video"
                />
              </div>
            )}

            {!config.showVideo && (
              <div className="flex-1 relative bg-black rounded-xl overflow-hidden mt-4">
                <video
                  ref={videoRef}
                  src="/videos/homepage.mp4"
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                >
                  Your browser does not support the video tag.
                </video>
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <button
                      onClick={() => videoRef.current?.play()}
                      className="w-16 h-16 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors pointer-events-auto"
                    >
                      <svg className="w-6 h-6 ml-1 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
