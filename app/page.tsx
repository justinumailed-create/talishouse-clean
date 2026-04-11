"use client";

import { useEffect, useState } from "react";
import HomeHero from "@/components/HomeHero";
import { supabase } from "@/lib/supabaseClient";
import ProductList from "@/components/ProductList";

export default function Home() {
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

        if (fetchError && fetchError.message) {
          console.error("Supabase Error:", fetchError);
          setError("Failed to load page content.");
        } else if (data) {
          const map: Record<string, string> = {};
          data.forEach((item: { title?: string | null; body?: string | null }) => {
            if (item.title && item.body) {
              map[item.title.trim()] = item.body;
            }
          });
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
    <div className="w-full bg-white">
      {error && (
        <div className="w-full px-6 lg:px-[80px]">
          <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        </div>
      )}

      <HomeHero
        title={content["homepage_hero_title"] || "TALISHOUSE™"}
        subtitle={content["homepage_hero_subtitle"] || "Homes and Cottages"}
      />

      {/* Products Section */}
      <section className="pb-8">
        <div className="w-full px-6 lg:px-[80px]">
          <ProductList />
        </div>
      </section>
    </div>
  );
}
