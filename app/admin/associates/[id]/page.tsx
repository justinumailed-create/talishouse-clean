"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AssociateSettings {
  id: string;
  name: string;
  fast_code: string;
  mapsite_slug: string | null;
  hero_type: "map" | "image" | "pdf";
  hero_content: string;
  page_headline: string;
  page_subtext: string;
  page_contact_cta: string;
  show_video: boolean;
  video_url: string;
  is_page_enabled: boolean;
}

export default function AssociateSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AssociateSettings | null>(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchSettings();
  }, [id]);

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from("associates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        setSettings({
          id: data.id,
          name: data.name,
          fast_code: data.fast_code,
          mapsite_slug: data.mapsite_slug,
          hero_type: data.hero_type || "map",
          hero_content: data.hero_content || "",
          page_headline: data.page_headline || "",
          page_subtext: data.page_subtext || "",
          page_contact_cta: data.page_contact_cta || "Refer a Project",
          show_video: data.show_video || false,
          video_url: data.video_url || "",
          is_page_enabled: data.is_page_enabled ?? true,
        });
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      setMessage({ text: "Failed to load settings", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const { error } = await supabase
        .from("associates")
        .update({
          hero_type: settings.hero_type,
          hero_content: settings.hero_content,
          page_headline: settings.page_headline,
          page_subtext: settings.page_subtext,
          page_contact_cta: settings.page_contact_cta,
          show_video: settings.show_video,
          video_url: settings.video_url,
          is_page_enabled: settings.is_page_enabled,
        })
        .eq("id", id);

      if (error) throw error;
      setMessage({ text: "Settings saved successfully", type: "success" });
    } catch (err) {
      console.error("Error saving settings:", err);
      setMessage({ text: "Failed to save settings", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
  if (!settings) return <div className="p-8 text-center text-red-500">Associate not found</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/associates" className="text-gray-500 hover:text-black transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">Associate Settings: {settings.name}</h1>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl border ${
          message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Left Panel Content */}
        <section className="bg-white border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            Main Content Area (Left 70%)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Hero Type</label>
              <select
                value={settings.hero_type}
                onChange={(e) => setSettings({ ...settings, hero_type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-black text-sm bg-white"
              >
                <option value="map">Map</option>
                <option value="image">Image</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Hero Content (URL for Image/PDF)
              </label>
              <input
                type="text"
                placeholder={settings.hero_type === 'map' ? 'Map uses default Atlist/Google' : 'https://...'}
                disabled={settings.hero_type === 'map'}
                value={settings.hero_content}
                onChange={(e) => setSettings({ ...settings, hero_content: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-black text-sm disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          </div>
        </section>

        {/* Media Area */}
        <section className="bg-white border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full" />
            Media Area (Right Bottom)
          </h2>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="show_video"
              checked={settings.show_video}
              onChange={(e) => setSettings({ ...settings, show_video: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
            />
            <label htmlFor="show_video" className="text-sm font-medium text-gray-700">
              Enable Video / YouTube Embed
            </label>
          </div>
          {settings.show_video && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Video URL or YouTube Link</label>
              <input
                type="text"
                placeholder="https://youtube.com/watch?v=... or direct mp4 link"
                value={settings.video_url}
                onChange={(e) => setSettings({ ...settings, video_url: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-black text-sm"
              />
              <p className="text-[10px] text-gray-400">Supports direct video uploads (under 30MB) or YouTube embeds.</p>
            </div>
          )}
        </section>

        {/* Text Content */}
        <section className="bg-white border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Page Text & CTA
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Headline</label>
              <input
                type="text"
                value={settings.page_headline}
                onChange={(e) => setSettings({ ...settings, page_headline: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-black text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Subtext</label>
              <textarea
                value={settings.page_subtext}
                onChange={(e) => setSettings({ ...settings, page_subtext: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-black text-sm resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Form CTA Button Text</label>
              <input
                type="text"
                value={settings.page_contact_cta}
                onChange={(e) => setSettings({ ...settings, page_contact_cta: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-black text-sm"
              />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
             <input
              type="checkbox"
              id="is_page_enabled"
              checked={settings.is_page_enabled}
              onChange={(e) => setSettings({ ...settings, is_page_enabled: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
            />
            <label htmlFor="is_page_enabled" className="text-sm font-medium text-gray-700">
              Page Published
            </label>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 border rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2.5 bg-black text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
