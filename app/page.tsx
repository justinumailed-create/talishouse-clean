"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import ProductList from "@/components/ProductList";
import { UI } from "@/styles/design-system";
import { formatCAD } from "@/utils/currency";

interface ContentBlock {
  id: string;
  title: string;
  displayType?: string;
  summary?: string;
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [content, setContent] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
  .from("content")
  .select("*");

console.log("DATA:", data);
console.log("ERROR:", fetchError);

if (fetchError && fetchError.message) {
  console.error("Supabase Error:", fetchError);
  setError("Failed to load page content.");
} else if (data) {
  const map: Record<string, string> = {};

  data.forEach((item: any) => {
    if (item.title && item.body) {
      map[item.title.trim()] = item.body;
    }
  });

  console.log("FINAL MAP:", map);
  setContent(map);
}
      } catch (err) {
        console.error("Unexpected Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[600px]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
          <p className="text-gray-400">Loading experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 lg:px-12 py-6 md:py-10">
      <div className="grid grid-cols-12 gap-8">
      {error && (
        <div className="col-span-12 mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Left Column - Map + Content */}
      <div className="col-span-12 lg:col-span-8 h-full">
        <div className="w-full h-full min-h-[350px] lg:min-h-[500px] rounded-2xl overflow-hidden bg-gray-200 shadow-sm">
          <iframe
            src="https://my.atlist.com/map/23edf5cc-e0b4-4d44-85fe-469f9606e876?share=true"
            allow="geolocation 'self' https://my.atlist.com"
            frameBorder="0"
            scrolling="no"
            allowFullScreen
            title="Talishouse property discovery map"
            className="w-full h-full min-h-[350px] lg:min-h-[500px]"
          />
        </div>
      </div>

      {/* Right Column - Info + Video */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <div className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-[#444] mb-4 font-bold">
            Global Overview
          </p>

          <h1 className="leading-tight mb-6">
            <span className="block text-2xl md:text-3xl font-semibold tracking-[0.15em] uppercase text-gray-900">
              {content['homepage_hero_title'] || 'TALISHOUSE™'}
            </span>
            <span className="block text-sm md:text-base text-gray-500">
              {content['homepage_hero_subtitle'] || 'Homes and Cottages'}
            </span>
          </h1>
          
          <ul className="space-y-4 mb-8">
            <li className="flex items-start text-base font-medium text-gray-800">
              <span className="mr-3 text-gray-900 font-bold">•</span>
              <span>{content['homepage_stats_price'] || `From ${formatCAD(58.50)} per sq.ft.`}</span>
            </li>
            <li className="flex items-start text-base font-medium text-gray-800">
              <span className="mr-3 text-gray-900 font-bold">•</span>
              <span>{content['homepage_stats_speed'] || "Up in a day and move in ready in a week"}</span>
            </li>
            <li className="flex items-start text-base font-medium text-gray-800">
              <span className="mr-3 text-gray-900 font-bold">•</span>
              <span>{content['homepage_stats_lease'] || "Lease-To-Own terms available, OAC"}</span>
            </li>
          </ul>

          <Link
            href="/add-project"
            className={UI.button}
          >
            Add A Project
          </Link>
        </div>

        <div className="relative bg-black rounded-2xl overflow-hidden min-h-[200px] md:min-h-[250px]">
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

      {/* Products Section */}
      <div className="col-span-12">
        <ProductList />
      </div>

      </div>
    </div>
  );
}
