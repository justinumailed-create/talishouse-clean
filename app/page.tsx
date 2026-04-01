"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAssociate } from "@/context/AssociateContext";

export const revalidate = 0;

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  async function handleLeadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;

    if (!name || !phone) {
      setError("Name and phone are required");
      setLoading(false);
      return;
    }

    const data = {
      name,
      phone,
      email: email || null,
      location: formData.get("location") as string || "Not specified",
      source: "homepage",
      status: "new",
    };

    const { error: insertError } = await supabase
      .from("leads")
      .insert([data]);

    if (insertError) {
      setError(`Creation failed: ${insertError.message}`);
      setLoading(false);
      return;
    }

    setLoading(false);
    window.location.href = "/project-received";
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-stretch w-full">
        <div className="lg:col-span-2 h-full">
          <div className="w-full h-full min-h-[300px] lg:min-h-[500px] rounded-xl overflow-hidden bg-gray-200">
            <iframe
              src="https://my.atlist.com/map/23edf5cc-e0b4-4d44-85fe-469f9606e876?share=true"
              allow="geolocation 'self' https://my.atlist.com"
              frameBorder="0"
              scrolling="no"
              allowFullScreen
              title="Talishouse property discovery map"
              className="w-full h-full min-h-[300px] lg:min-h-[500px]"
            />
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col h-full">
          <div className="flex-shrink-0 bg-white border rounded-xl p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-[#1E4ED8] mb-4 font-bold">
              Global Overview
            </p>

            <h1 className="leading-tight mb-6">
              <span className="block text-2xl md:text-3xl font-extrabold tracking-[0.15em] uppercase text-gray-900">
                TALISHOUSE&trade;
              </span>
              <span className="block text-sm md:text-base font-light tracking-[0.3em] uppercase text-gray-500">
                Homes and Cottages
              </span>
            </h1>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-start text-base font-medium text-gray-800">
                <span className="mr-3 text-gray-900 font-bold">•</span>
                <span>From $58.50 per sq.ft.</span>
              </li>
              <li className="flex items-start text-base font-medium text-gray-800">
                <span className="mr-3 text-gray-900 font-bold">•</span>
                <span>Up in a day and move in ready in a week</span>
              </li>
              <li className="flex items-start text-base font-medium text-gray-800">
                <span className="mr-3 text-gray-900 font-bold">•</span>
                <span>Lease-To-Own terms available, OAC</span>
              </li>
              <li className="flex items-start text-lg font-bold text-gray-900 mt-4 pt-4 border-t border-gray-200">
                Just add ambition
              </li>
            </ul>

            <Link
              href="/propose-project"
              className="block w-full text-center text-base font-medium text-white bg-[#1E4ED8] hover:bg-[#1d4ed8] rounded-lg px-6 py-4 transition-colors"
              style={{ backgroundColor: '#1E4ED8', color: '#ffffff' }}
            >
              Add A Project
            </Link>
          </div>

          <div className="flex-1 relative bg-black rounded-xl overflow-hidden mt-6">
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
        </div>
      </div>
    </div>
  );
}
