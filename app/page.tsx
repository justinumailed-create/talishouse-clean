"use client";

import { useEffect, useState } from "react";
import HomeHero from "@/components/HomeHero";
import { supabase } from "@/lib/supabaseClient";
import ProductList from "@/components/ProductList";
import KineticScroll from "@/components/KineticScroll";

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
    <>
      {/* DESKTOP LAYOUT - hidden on mobile */}
      <div className="desktop-only w-full bg-white">
        {error && (
          <div className="w-full px-5">
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
          <div className="max-w-[1400px] mx-auto px-5">
            <ProductList />
          </div>
        </section>
      </div>

      {/* MOBILE FORK - hidden on desktop */}
      <div className="mobile-only">
        <div className="mobile-home">
          {/* HERO */}
          <div className="mobile-hero">
            <h1>TALISHOUSE™</h1>
            <p>Homes & Cottages</p>
          </div>

          {/* ANIMATED DESKTOP FEATURES/BENEFITS TEXT */}
          <KineticScroll />

          {/* APPLE-STYLE CTA BLOCK */}
          <div className="mobile-cta-card">
            <div className="cta-card-inner">
              <h2 className="cta-title">Propose a Project</h2>
              <p className="cta-subtitle">Start your journey with Talishouse</p>
              <a href="/business-office/apply" className="cta-button">
                Propose a Project
              </a>
            </div>
          </div>

          {/* FULL WIDTH VIDEO - OUTSIDE CTA BLOCK */}
          <div className="mobile-video">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full rounded-2xl"
              poster="/images/talishouse-400.svg"
            >
              <source src="/videos/talishouse-hero.mp4" type="video/mp4" />
            </video>
          </div>

          {/* EXPLORE MAPSITE */}
          <div className="mobile-cta">
            <a href="/mapsite">Explore Mapsite</a>
          </div>
        </div>
      </div>
    </>
  );
}
