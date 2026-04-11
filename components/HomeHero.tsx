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
      <div className="w-full px-6 lg:px-[80px]">
        <div className="grid grid-cols-[70%_30%] gap-6 items-stretch w-full">
          
          {/* LEFT COLUMN */}
          <div className="flex flex-col h-full gap-4">
            
            {/* TEXT CARD (TOP) */}
            <div className="p-6 border rounded-2xl bg-white">
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
              <div className="grid grid-cols-2 gap-6 items-start">
                
                {/* LEFT COLUMN */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs tracking-[0.2em] text-neutral-400 uppercase">
                    GLOBAL OVERVIEW
                  </p>
                  <div className="flex items-center gap-4">
                    <h1 className="text-[26px] font-semibold tracking-tight">
                      {title}
                    </h1>
                  </div>
                  <p className="text-sm text-neutral-500">
                    {subtitle}
                  </p>
                  <Link 
                    href="/add-project"
                    className="inline-block bg-black text-white text-sm px-4 py-2 rounded-full hover:bg-neutral-800 transition-colors w-fit mt-2"
                  >
                    Join Us
                  </Link>
                </div>

                {/* RIGHT COLUMN */}
                <div className="flex flex-col gap-2 text-right">
                  <p className="fade-line delay-1 text-sm text-neutral-600">
                    From CAD $59 per sq.ft.
                  </p>
                  <p className="fade-line delay-2 text-sm text-neutral-600">
                    Up in a day, move in ready in a week
                  </p>
                  <p className="fade-line delay-3 text-sm text-neutral-600">
                    Lease-To-Own terms available, OAC
                  </p>
                </div>

              </div>
            </div>

            {/* MAP BLOCK (BOTTOM) */}
            <div className="flex-1 rounded-2xl overflow-hidden">
              <iframe
                src="https://my.atlist.com/map/23edf5cc-e0b4-4d44-85fe-469f9606e876?share=true"
                allow="geolocation 'self' https://my.atlist.com"
                className="block w-full h-full border-0"
                title="Talishouse property discovery map"
              />
            </div>
          </div>

          {/* RIGHT COLUMN (VIDEO) */}
          <div className="h-full rounded-2xl overflow-hidden relative group cursor-pointer">
            <video
              ref={videoRef}
              src="/videos/homepage.mp4"
              className="w-full h-full object-cover"
              playsInline
              controls={false}
              onTouchStart={toggleVideo}
            />
            <div
              onClick={toggleVideo}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out"
            >
              <div className="
                w-16 h-16
                rounded-full
                backdrop-blur-xl
                bg-white/30
                border border-white/40
                flex items-center justify-center
                transition-all duration-300 ease-out
                group-hover:scale-110
                group-hover:bg-white/40
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

        </div>
      </div>
    </section>
  );
}
