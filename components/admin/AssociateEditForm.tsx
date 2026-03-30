"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface PageConfig {
  heroType: "map" | "image" | "gallery" | "pdf" | "video";
  heroContent: string;
  headline: string;
  subtext: string;
  ctaText: string;
  showForm: boolean;
  showVideo: boolean;
  videoUrl: string;
}

export default function EditAssociateContent({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [associate, setAssociate] = useState<any>(null);
  const [config, setConfig] = useState<PageConfig>({
    heroType: "map",
    heroContent: "",
    headline: "",
    subtext: "",
    ctaText: "Propose a Project",
    showForm: false,
    showVideo: false,
    videoUrl: ""
  });

  useEffect(() => {
    async function fetchAssociate() {
      try {
        const res = await fetch("/api/associates/list");
        const data = await res.json();
        const found = data.find((a: any) => a.id === id);
        
        if (found) {
          setAssociate(found);
          setConfig(found.pageConfig || {
            heroType: "map",
            heroContent: "",
            headline: "TALISHOUSE™ HOMES",
            subtext: "",
            ctaText: "Propose a Project",
            showForm: false,
            showVideo: false,
            videoUrl: ""
          });
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
      setLoading(false);
    }

    fetchAssociate();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);

    try {
      const res = await fetch("/api/associates/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          updates: { pageConfig: config }
        })
      });

      const data = await res.json();

      if (data.success) {
        alert("Settings saved!");
        router.push("/admin/associates");
      } else {
        alert("Error: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-center text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!associate) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-center text-gray-500">Associate not found</p>
        <a href="/admin/associates" className="block text-center text-blue-600 mt-4">← Back to Associates</a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <a href="/admin/associates" className="text-sm text-gray-500 hover:text-gray-700 mb-4 block">
        ← Back to Associates
      </a>

      <h1 className="text-2xl font-semibold mb-2">Edit Associate</h1>
      <p className="text-gray-500 mb-6">{associate.name} ({associate.fastCode})</p>

      <div className="space-y-6">
        {/* Hero Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Hero Type</label>
          <select
            value={config.heroType}
            onChange={(e) => setConfig({ ...config, heroType: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="map">Map</option>
            <option value="image">Image</option>
            <option value="gallery">Gallery</option>
            <option value="pdf">PDF</option>
            <option value="video">Video</option>
          </select>
        </div>

        {/* Hero Content */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Hero Content URL
            {config.heroType === "gallery" && <span className="text-gray-400 font-normal"> (comma-separated for multiple)</span>}
          </label>
          <input
            type="text"
            value={config.heroContent}
            onChange={(e) => setConfig({ ...config, heroContent: e.target.value })}
            placeholder={config.heroType === "gallery" ? "url1.jpg, url2.jpg, url3.jpg" : "Enter URL"}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Headline */}
        <div>
          <label className="block text-sm font-medium mb-2">Headline</label>
          <input
            type="text"
            value={config.headline}
            onChange={(e) => setConfig({ ...config, headline: e.target.value })}
            placeholder="TALISHOUSE™ HOMES"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Subtext */}
        <div>
          <label className="block text-sm font-medium mb-2">Subtext</label>
          <input
            type="text"
            value={config.subtext}
            onChange={(e) => setConfig({ ...config, subtext: e.target.value })}
            placeholder="Homes and Cottages"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* CTA Text */}
        <div>
          <label className="block text-sm font-medium mb-2">CTA Button Text</label>
          <input
            type="text"
            value={config.ctaText}
            onChange={(e) => setConfig({ ...config, ctaText: e.target.value })}
            placeholder="Propose a Project"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Video URL */}
        <div>
          <label className="block text-sm font-medium mb-2">Video URL (optional)</label>
          <input
            type="text"
            value={config.videoUrl}
            onChange={(e) => setConfig({ ...config, videoUrl: e.target.value })}
            placeholder="https://youtube.com/embed/..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Toggle Form */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="showForm"
            checked={config.showForm}
            onChange={(e) => setConfig({ ...config, showForm: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="showForm" className="text-sm">Show project proposal form on page</label>
        </div>

        {/* Toggle Video */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="showVideo"
            checked={config.showVideo}
            onChange={(e) => setConfig({ ...config, showVideo: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="showVideo" className="text-sm">Show video section on page</label>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
