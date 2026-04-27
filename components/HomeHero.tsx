"use client";

import { useRef, useState } from "react";
import Link from "next/link";

interface HomeHeroProps {
  title: string;
  subtitle: string;
}

export default function HomeHero({ title, subtitle }: HomeHeroProps) {
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
      <div className="max-w-[1400px] mx-auto px-5">
        <div className="flex flex-col md:grid md:grid-cols-[2fr_1fr] items-stretch gap-4 md:gap-6 w-full">
          
          {/* LEFT COLUMN WRAPPER */}
          <div className="flex flex-col h-full gap-4">
            
            {/* TEXT CARD (SMALL) */}
            <div className="w-full h-[180px] md:h-[200px] rounded-xl overflow-hidden flex flex-col justify-center p-4 md:p-5 border bg-white">
              <style dangerouslySetInnerHTML={{ __html: `
                .fade-line {
                  opacity: 0;
                  transform: translateY(20px);
                  filter: blur(6px);
                  animation: appleFadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
                .delay-1 { animation-delay: 0.2s; }
                .delay-2 { animation-delay: 0.4s; }
                .delay-3 { animation-delay: 0.6s; }
                @keyframes appleFadeUp {
                  to {
                    opacity: 1;
                    transform: translateY(0);
                    filter: blur(0);
                  }
                }
              `}} />
              <div className="flex flex-col md:flex-row gap-3 md:gap-5 w-full">
                
                {/* LEFT SIDE */}
                <div className="flex flex-col gap-1 text-left flex-1">
                  <p className="text-[10px] md:text-xs tracking-[0.15em] text-neutral-400 uppercase">
                    GLOBAL OVERVIEW
                  </p>
                  <h1 className="text-[22px] md:text-[28px] font-semibold tracking-tight leading-tight">
                    {title}
                  </h1>
                  <p className="text-[12px] md:text-[13px] text-neutral-500 leading-relaxed">
                    {subtitle}
                  </p>
                  <Link 
                    href="/business-office/apply"
                    className="inline-block bg-black text-white text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full hover:bg-neutral-800 transition-colors w-fit mt-1 md:mt-2"
                  >
                    Propose a Project
                  </Link>
                </div>

                {/* RIGHT SIDE */}
                <div className="flex flex-col gap-1 text-left md:text-right">
                  <p className="text-[10px] md:text-xs tracking-[0.15em] text-neutral-400 uppercase">
                    FEATURES
                  </p>
                  <p className="fade-line delay-1 text-[12px] md:text-[14px] font-medium tracking-tight text-neutral-700">
                    From CAD $62.50/sq.ft.
                  </p>
                  <p className="fade-line delay-2 text-[12px] md:text-[14px] font-medium tracking-tight text-neutral-700">
                    Up in a day, finished in a week
                  </p>
                  <p className="fade-line delay-3 text-[12px] md:text-[14px] font-medium tracking-tight text-neutral-700">
                    Retail and Wholesale Terms available
                  </p>
                  <p className="fade-line delay-3 text-[12px] md:text-[14px] font-medium tracking-tight text-neutral-700">
                    Lease-To-Own, OAC.
                  </p>
                </div>

              </div>
            </div>

            {/* MAP BLOCK (FLEX FILL) */}
            <div className="w-full flex-1 min-h-0 sm:min-h-[300px] rounded-xl overflow-hidden">
              <iframe
                src="https://my.atlist.com/map/23edf5cc-e0b4-4d44-85fe-469f9606e876?share=true"
                allow="geolocation 'self' https://my.atlist.com"
                className="block w-full h-full border-0"
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
