"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatCAD } from "@/utils/currency";

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

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        alert("Project submitted successfully!");
        setFormData({ message: "", location: "" });
      }
    } catch (err: any) {
      console.warn("Project submit failed:", err?.message || err);
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
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

            <div className="flex flex-col self-stretch min-h-0 gap-4">

              <div className="flex-[2] rounded-2xl bg-white/5 backdrop-blur-xl p-4 flex flex-col justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#444] mb-2 font-bold">
                    Global Overview
                  </p>
                  <h1 className="leading-tight">
                    <span className="block text-xl md:text-2xl font-semibold tracking-[0.15em] uppercase text-gray-900">
                      {config.headline || "TALISHOUSE™"}
                    </span>
                    <span className="block text-sm text-gray-500">
                      {config.subtext || "Homes and Cottages"}
                    </span>
                  </h1>
                </div>
                
                <div>
                  <ul className="space-y-1 mb-3">
                    <li className="flex items-start text-sm font-medium text-gray-800">
                      <span className="mr-2 text-gray-900 font-bold">•</span>
                      <span>From {formatCAD(58.50)}/sq.ft.</span>
                    </li>
                    <li className="flex items-start text-sm font-medium text-gray-800">
                      <span className="mr-2 text-gray-900 font-bold">•</span>
                      <span>Move in ready in a week</span>
                    </li>
                  </ul>

                  <Link
                    href={`/propose-project?fast=${fastCode}`}
                    className="block w-full text-center text-sm font-medium text-white bg-black hover:bg-[#2b2b2b] rounded-lg px-4 py-3 transition-colors"
                    style={{ backgroundColor: '#000000', color: '#ffffff' }}
                  >
                    {config.ctaText || "Propose a Project"}
                  </Link>
                </div>
              </div>

              <div className="flex-[8] rounded-2xl overflow-hidden">
                {renderHeroContent()}
              </div>
            </div>

            <div className="self-start">
              <video
                ref={videoRef}
                src="/videos/homepage.mp4"
                controls
                playsInline
                className="block w-full h-auto rounded-2xl"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              >
                Your browser does not support the video tag.
              </video>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
