"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FeatureSlider } from "@/components/FeatureSlider";

interface HomeHeroProps {
  title: string;
  subtitle: string;
}

export default function HomeHero({ title, subtitle }: HomeHeroProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleVideo = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <section className="pt-6 pb-8 bg-[#f8f8f7]">
      <div className="w-full px-5">
        <div className="flex flex-col md:grid md:grid-cols-[2fr_1fr] items-stretch gap-4 md:gap-6 w-full">
          
          {/* LEFT COLUMN WRAPPER */}
          <div className="flex flex-col h-full gap-4">
            
            {/* TEXT CARD (SMALL) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-[140px] md:h-[160px] rounded-xl overflow-hidden flex items-center p-3 md:p-4 border bg-white"
            >
              <div className="grid grid-cols-3 items-center w-full">
                
                {/* LEFT COLUMN */}
                <div className="flex flex-col gap-1 text-left">
                  <p className="text-[10px] md:text-xs tracking-[0.15em] text-neutral-400 uppercase">
                    GLOBAL OVERVIEW
                  </p>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                    {title}
                  </h1>
                  <p className="text-sm md:text-base text-neutral-500 leading-relaxed">
                    {subtitle}
                  </p>
                </div>

                {/* CENTER COLUMN */}
                <div className="flex justify-center items-center">
                  <FeatureSlider />
                </div>

                {/* RIGHT COLUMN */}
                <div className="flex justify-end items-center">
                  <button
                    onClick={() => {
                      router.replace("/business-office/apply");
                      router.refresh();
                    }}
                    className="inline-block bg-black text-white text-sm md:text-base px-6 py-3 rounded-full hover:bg-neutral-800 transition-colors cursor-pointer shadow-md hover:shadow-lg"
                  >
                    Propose a Project
                  </button>
                </div>

              </div>
            </motion.div>

            {/* MAP BLOCK (FLEX FILL) */}
            <div className="map-container flex-1 min-h-0 sm:min-h-[300px]">
              <iframe
                src="https://my.atlist.com/map/23edf5cc-e0b4-4d44-85fe-469f9606e876?share=true"
                allow="geolocation 'self' https://my.atlist.com"
                className="block w-full h-full border-0"
                style={{ width: '100%', height: '100%' }}
                title="Talishouse property discovery map"
              />
            </div>

          </div>

          {/* VIDEO & BUTTON COLUMN */}
          <div className="flex flex-col gap-3">
            <div className="w-full aspect-video md:h-full md:aspect-auto rounded-xl overflow-hidden relative group cursor-pointer min-h-[300px]">
              <video
                ref={videoRef}
                src="/videos/homepage.mp4"
                className="w-full h-full object-cover"
                playsInline
                controls={false}
                onClick={toggleVideo}
                onTouchStart={toggleVideo}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
              <div
                onClick={toggleVideo}
                className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${isPlaying ? "opacity-0 pointer-events-none" : "opacity-100"}`}
              >
                <div className="
                  w-16 h-16
                  rounded-full
                  backdrop-blur-xl
                  bg-white/30
                  border border-white/40
                  flex items-center justify-center
                  transition-all duration-300 ease-out
                  hover:scale-110
                  hover:bg-white/40
                  shadow-[0_10px_40px_rgba(0,0,0,0.08)]
                ">
                  {isPlaying ? (
                    <div className="w-3 h-3 bg-black" />
                  ) : (
                    <div className="ml-1 w-0 h-0 border-l-[10px] border-l-black border-y-[6px] border-y-transparent" />
                  )}
                </div>
              </div>
            </div>

            <Link
              href="/mapsite"
              className="
                w-full
                h-[48px]
                rounded-full
                bg-white
                border border-[#e5e5e5]
                text-gray-900
                text-sm font-medium
                shadow-sm
                hover:shadow-md
                transition-all
                duration-200
                flex items-center justify-center
                tracking-tight
              "
            >
              Explore Mapsite™
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
