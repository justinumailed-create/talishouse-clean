"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface ContentBlock {
  id: string;
  title: string;
  summary: string;
  displayType: string;
}

interface GlobalContentRow {
  id: string;
  title?: string | null;
  summary?: string | null;
  displayType?: string | null;
}

export default function ContentPage() {
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [activeId, setActiveId] = useState<string | null>(null);

  async function fetchContentBlocks() {
    setLoading(true);

    const { data, error } = await supabase.from("GlobalContent").select("*");

    if (error) {
      console.error("Supabase Error:", error.message || error);
      setContentBlocks([]);
      setDrafts({});
      setLoading(false);
      return;
    }

    const mappedData = ((data || []) as GlobalContentRow[]).map((item) => ({
      id: String(item.id),
      title: item.title || "",
      summary: item.summary || "",
      displayType: item.displayType || "text",
    }));

    setContentBlocks(mappedData);
    setDrafts(
      mappedData.reduce<Record<string, string>>((acc, item) => {
        acc[item.id] = item.title;
        return acc;
      }, {}),
    );
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchContentBlocks();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const handleSave = async (id: string) => {
    setActiveId(id);
    setStatus('saving');

    const nextTitle = drafts[id] || "";
    const { error } = await supabase.from("GlobalContent").update({ title: nextTitle }).eq("id", id);

    if (error) {
      console.error("Supabase Error:", error.message || error);
      setStatus('error');
    } else {
      setContentBlocks((current) =>
        current.map((item) => (item.id === id ? { ...item, title: nextTitle } : item)),
      );
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setActiveId(null);
      }, 2000);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Global Content</h1>
        <p className="text-sm text-[#6e6e73] mt-1">Edit and save shared content from the GlobalContent table.</p>
      </div>

      {contentBlocks.length === 0 ? (
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 text-sm text-[#6e6e73]">
          No content available
        </div>
      ) : (
        <div className="space-y-4">
          {contentBlocks.map((block) => (
            <div key={block.id} className="rounded-xl border border-[#e5e5e5] bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6e6e73]">Key</p>
                    <p className="text-sm font-medium text-[#111] break-all">{block.id}</p>
                  </div>
                  {block.summary && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6e6e73]">Description</p>
                      <p className="text-sm font-medium text-[#111] break-all">{block.summary}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6e6e73]">Type</p>
                    <p className="text-sm font-medium text-[#111] break-all uppercase">{block.displayType}</p>
                  </div>
                </div>
              </div>

              <textarea
                value={drafts[block.id] ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setDrafts((current) => ({ ...current, [block.id]: value }));
                }}
                rows={4}
                className="w-full rounded-xl border border-[#d9d9de] p-3 text-sm text-[#111] outline-none focus:border-[#1E4ED8]"
              />

              <div className="flex justify-end items-center gap-4">
                {activeId === block.id && (
                  <div className="text-sm font-medium">
                    {status === 'saving' && <p className="text-[#6e6e73]">Saving...</p>}
                    {status === 'success' && <p className="text-green-600">Saved successfully</p>}
                    {status === 'error' && <p className="text-red-600">Error saving</p>}
                  </div>
                )}
                <button
                  onClick={() => {
                    void handleSave(block.id);
                  }}
                  disabled={status === 'saving' && activeId === block.id}
                  className="rounded-lg bg-[#111] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {status === 'saving' && activeId === block.id ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
