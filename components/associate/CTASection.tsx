"use client";

import { useState } from "react";
import { generateProjectCode } from "@/lib/projectCode";

interface CTASectionProps {
  fastCode: string;
}

export default function CTASection({ fastCode }: CTASectionProps) {
  const [message, setMessage] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const projectCode = generateProjectCode(fastCode);
    console.log("PROJECT:", projectCode);

    try {
      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fastCode,
          projectCode,
          message,
          address
        })
      });

      const data = await res.json();
      console.log("PROJECT RESPONSE:", data);

      if (data.success) {
        alert(`Project submitted! Code: ${data.projectCode}`);
        setMessage("");
        setAddress("");
      }
    } catch (err) {
      console.error("Submit error:", err);
    }

    setLoading(false);
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">
        Propose a Project
      </h1>

      <div className="aspect-video bg-gray-200 rounded-xl flex items-center justify-center">
        <span className="text-gray-400">Video / Promo</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          placeholder="Your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/20 resize-none"
          rows={3}
        />

        <input
          placeholder="Project Address / Geo Location"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/20"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#1E4ED8] text-white font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Project"}
        </button>
      </form>
    </div>
  );
}
