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
    <div className="w-full px-6 lg:px-[75px] py-6 md:py-10">
      <div className="grid grid-cols-12 gap-10 lg:gap-12">
      {error && (
        <div className="col-span-12 mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Left Column - Map + Content */}
      <div className="col-span-12 lg:col-span-7">
        <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-200 shadow-sm transition-transform duration-500 hover:scale-[1.01]">
          <iframe
            src="https://my.atlist.com/map/23edf5cc-e0b4-4d44-85fe-469f9606e876?share=true"
            allow="geolocation 'self' https://my.atlist.com"
            frameBorder="0"
            scrolling="no"
            allowFullScreen
            title="Talishouse property discovery map"
            className="w-full aspect-video lg:aspect-auto lg:h-full min-h-[400px]"
          />
        </div>
      </div>

      {/* Right Column - Info + Video */}
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-3 w-full">
        <div className="w-full bg-white border rounded-2xl p-6 md:p-8 shadow-sm">
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
              <span>{content['homepage_stats_speed'] || "Up in a day, move in ready in a week"}</span>
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
            Join Us
          </Link>
        </div>

        <video
          ref={videoRef}
          src="/videos/homepage.mp4"
          controls
          playsInline
          className="w-full h-auto object-cover object-[50%_10%] rounded-lg mt-[-4px]"
        >
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Products Section */}
      <div className="col-span-12">
        <ProductList />
      </div>

      </div>
    </div>
  );
}
