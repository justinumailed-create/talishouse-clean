"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAssociate } from "@/context/AssociateContext";
import { UI } from "@/styles/design-system";

export default function PartnerViewPage() {
  const router = useRouter();
  const { fastCode } = useAssociate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const projectDescription = formData.get("projectDescription") as string;

    if (!name || !phone || !email) {
      setError("Name, phone, and email are required");
      setLoading(false);
      return;
    }

    const payload = {
      name,
      email,
      phone,
      location: "unknown",
      participation_level: "referral",
      status: "pending",
      created_at: new Date().toISOString(),
    };

    try {
      const { error: insertError } = await supabase.from("applications").insert([payload]);
      if (insertError) throw insertError;
      
      router.push("/success");
      router.refresh();
    } catch (err) {
      console.error("APPLICATION FAIL:", JSON.stringify(err, null, 2));
      setError("Failed to submit. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f8f7] py-8 md:py-12">
      <div className="w-full px-5">
        <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-6">

          {/* LEFT PANEL - MAP */}
          <div className="map-container w-full min-h-[300px] md:min-h-[600px]">
            <iframe
              src="https://my.atlist.com/map/23edf5cc-e0b4-4d44-85fe-469f9606e876?share=true"
              allow="geolocation 'self' https://my.atlist.com"
              className="block w-full h-full border-0"
              style={{ width: '100%', height: '100%' }}
              title="Talishouse property discovery map"
            />
          </div>

          {/* RIGHT PANEL */}
          <div className="space-y-4">

            {/* INTRO VIDEO */}
            <div className="w-full h-[220px] md:h-[260px] rounded-2xl overflow-hidden relative group cursor-pointer">
              <video
                ref={videoRef}
                src="/videos/homepage.mp4"
                className="w-full h-full object-cover"
                playsInline
                controls={false}
                onClick={toggleVideo}
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

            {/* LEAD FORM */}
            <div className="bg-white border rounded-2xl p-4 space-y-3">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Partner with Talishouse™
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Join our network of partners and grow with us
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className={UI.label}>Name</span>
                  <input
                    required
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    className={UI.input}
                  />
                </label>

                <label className="block">
                  <span className={UI.label}>Email</span>
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    className={UI.input}
                  />
                </label>

                <label className="block">
                  <span className={UI.label}>Phone</span>
                  <input
                    required
                    type="tel"
                    name="phone"
                    placeholder="(555) 000-0000"
                    className={UI.input}
                  />
                </label>

                <label className="block">
                  <span className={UI.label}>Tell us about your project</span>
                  <textarea
                    name="projectDescription"
                    rows={3}
                    placeholder="Share your vision..."
                    className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                </label>

                {error && (
                  <p className="text-red-600 text-xs">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={UI.button}
                >
                  {loading ? "Submitting..." : "GET STARTED"}
                </button>
              </form>

              <p className="text-xs text-gray-400 text-center">
                By submitting, you agree to our{" "}
                <Link href="/terms" className="underline">Terms</Link> and{" "}
                <Link href="/privacy" className="underline">Privacy Policy</Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}