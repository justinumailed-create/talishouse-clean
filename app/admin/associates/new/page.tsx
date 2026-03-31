"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewAssociatePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    fastCode: "",
    introMessage: "",
    pageHeadline: "",
    pageSubtext: "",
    pageContactCta: "",
    pageFooterNote: "",
    pageCustomMessage: "",
  });
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [generatedCode, setGeneratedCode] = useState("");

  useEffect(() => {
    if (form.name.trim() && !form.fastCode) {
      const code = "FAST-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      setForm((prev) => ({ 
        ...prev, 
        fastCode: code,
        pageHeadline: `Partnered with ${form.name.trim()}`
      }));
    }
  }, [form.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const fastCode = form.fastCode.trim().toUpperCase() || "FAST-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const slug = form.name.trim().toLowerCase().replace(/\s+/g, "-");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      fastCode: form.fastCode.trim().toUpperCase() || null,
      introMessage: form.introMessage.trim() || null,
      videoUrl: videoUrl.trim() || null,
      pageHeadline: form.pageHeadline.trim() || null,
      pageSubtext: form.pageSubtext.trim() || null,
      pageContactCta: form.pageContactCta.trim() || null,
      pageFooterNote: form.pageFooterNote.trim() || null,
      pageCustomMessage: form.pageCustomMessage.trim() || null,
    };

    try {
      const res = await fetch("/api/associates/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        setError("Creation failed: " + text);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      
      if (data.success) {
        setGeneratedCode(data.fastCode);
        setSuccess(true);
        router.refresh();
      } else {
        setError(data.error || "Failed to create associate");
      }
    } catch (err) {
      console.error("FETCH ERROR:", err);
      setError("API not reachable - check console for details");
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/associate/${generatedCode}`);
  };

  const copyFastCode = () => {
    navigator.clipboard.writeText(generatedCode);
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-semibold mb-2">Associate Created Successfully</h2>
          <p className="text-[#6e6e73] mb-6">
            {form.name} has been added to the system.
          </p>

          <div className="bg-[#f5f5f7] rounded-lg p-4 mb-6">
            <p className="text-xs text-[#6e6e73] mb-1">FAST CODE</p>
            <p className="text-2xl font-mono font-semibold">{generatedCode}</p>
          </div>

          <p className="text-sm text-[#6e6e73] mb-4">
            Personal Page:<br />
            <span className="text-[#111] font-medium">/associate/{generatedCode}</span>
          </p>

          <div className="flex gap-3 justify-center">
            <button onClick={copyLink} className="btn-primary">Copy Link</button>
            <button onClick={copyFastCode} className="px-4 py-2 bg-[#f5f5f7] text-[#111] rounded-lg text-sm font-medium hover:bg-[#e8e8ed]">Copy FAST Code</button>
            <Link href={`/associate/${generatedCode}`} target="_blank" className="px-4 py-2 border border-[#e5e5e5] text-[#111] rounded-lg text-sm font-medium hover:bg-[#f5f5f7]">View Page</Link>
          </div>

          <button
            onClick={() => {
              setSuccess(false);
              setGeneratedCode("");
              setForm({
                name: "",
                email: "",
                phone: "",
                fastCode: "",
                introMessage: "",
                pageHeadline: "",
                pageSubtext: "",
                pageContactCta: "",
                pageFooterNote: "",
                pageCustomMessage: "",
              });
              setVideoUrl("");
            }}
            className="block mt-6 text-sm text-[#1E4ED8] hover:underline"
          >
            Create Another Associate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex gap-8">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold mb-6">Create Associate</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-lg text-sm outline-none focus:border-[#1E4ED8]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-lg text-sm outline-none focus:border-[#1E4ED8]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-lg text-sm outline-none focus:border-[#1E4ED8]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">FAST Code</label>
              <input
                type="text"
                value={form.fastCode}
                onChange={(e) => setForm({ ...form, fastCode: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-lg text-sm outline-none focus:border-[#1E4ED8] font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Intro Message</label>
              <textarea
                value={form.introMessage}
                onChange={(e) => setForm({ ...form, introMessage: e.target.value })}
                className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-lg text-sm outline-none focus:border-[#1E4ED8] resize-none"
                rows={4}
              />
            </div>

            <div className="border-t border-[#e5e5e5] pt-5 mt-5">
              <h3 className="font-semibold mb-4">Page Customization</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Page Headline</label>
                  <input
                    type="text"
                    value={form.pageHeadline}
                    onChange={(e) => setForm({ ...form, pageHeadline: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-lg text-sm outline-none focus:border-[#1E4ED8]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Page Subtext</label>
                  <textarea
                    value={form.pageSubtext}
                    onChange={(e) => setForm({ ...form, pageSubtext: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-lg text-sm outline-none focus:border-[#1E4ED8] resize-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contact CTA Text</label>
                  <input
                    type="text"
                    value={form.pageContactCta}
                    onChange={(e) => setForm({ ...form, pageContactCta: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-lg text-sm outline-none focus:border-[#1E4ED8]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Footer Note</label>
                  <input
                    type="text"
                    value={form.pageFooterNote}
                    onChange={(e) => setForm({ ...form, pageFooterNote: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-lg text-sm outline-none focus:border-[#1E4ED8]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Custom Message (Optional)</label>
                  <textarea
                    value={form.pageCustomMessage}
                    onChange={(e) => setForm({ ...form, pageCustomMessage: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-lg text-sm outline-none focus:border-[#1E4ED8] resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Video URL</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-lg text-sm outline-none focus:border-[#1E4ED8]"
                placeholder="Paste video URL (YouTube / MP4)"
              />
              <p className="text-xs text-gray-500 mt-1">Optional: Add a promotional video to display on the associate page</p>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? "Creating..." : "Create Associate"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
