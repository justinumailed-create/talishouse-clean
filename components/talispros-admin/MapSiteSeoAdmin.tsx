"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Upload } from "lucide-react";
import type { MapSiteSeoListItem } from "@/lib/mapsite-service";
import {
  saveMapSiteSeo,
  uploadMapSiteAsset,
} from "@/lib/mapsite-admin-service";
import { publishedMapSitePath } from "@/lib/talispros/mapsite-state";

const MAPSITE_SHARE_ORIGIN = "https://talispros.com";

const inputClass =
  "w-full h-11 px-4 bg-white border border-neutral-200 text-sm text-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20";

const textareaClass =
  "w-full px-4 py-3 bg-white border border-neutral-200 text-sm text-neutral-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/20 resize-y";

function displayFastCode(code: string): string {
  return code.trim().toUpperCase();
}

function mapsiteLiveUrl(fastCode: string): string {
  return `${MAPSITE_SHARE_ORIGIN}${publishedMapSitePath(fastCode)}`;
}

function previewHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toUpperCase();
  } catch {
    return "TALISPROS.COM";
  }
}

function WhatsAppIphonePreview({
  fastCode,
  title,
  description,
  imageUrl,
}: {
  fastCode: string;
  title: string;
  description: string;
  imageUrl: string;
}) {
  const liveUrl = mapsiteLiveUrl(fastCode);
  const host = previewHost(liveUrl);
  const previewTitle = title.trim() || `${displayFastCode(fastCode)} | Mapsite™`;
  const previewDescription = description.trim() || `Mapsite™ ${displayFastCode(fastCode)}`;
  const displayPath = liveUrl.replace(/^https?:\/\//, "");

  return (
    <div
      className="flex h-full min-h-[640px] items-center justify-center rounded-2xl bg-[#ecece8] px-4 py-6"
      aria-label="WhatsApp link preview"
    >
      <div className="relative h-[640px] w-[312px] shrink-0 rounded-[46px] bg-neutral-950 p-[9px] shadow-[0_24px_60px_rgba(0,0,0,0.28)] ring-1 ring-black/40">
        <div className="relative h-full w-full overflow-hidden rounded-[37px] bg-[#efeae2]">
          <div className="absolute left-1/2 top-[10px] z-30 h-[26px] w-[96px] -translate-x-1/2 rounded-full bg-neutral-950" />

          <div className="relative z-20 flex items-end justify-between bg-[#008069] px-5 pb-2.5 pt-11 text-white">
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <path
                  d="M15 5 8 12l7 7"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-[11px] font-semibold">
                {displayFastCode(fastCode).slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold leading-tight">
                  Mapsite™
                </p>
                <p className="text-[10px] leading-tight text-white/75">online</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white/90">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M17 10.5V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3.5l4 4v-11z" />
              </svg>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                <path
                  d="M22 16.92v2a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.07 2h2a2 2 0 0 1 2 1.72c.13.96.35 1.9.68 2.8a2 2 0 0 1-.45 2.11L7.1 9.91a16 16 0 0 0 6 6l1.28-1.2a2 2 0 0 1 2.11-.45c.9.33 1.84.55 2.8.68A2 2 0 0 1 22 16.92z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className="absolute inset-x-0 top-[76px] bottom-0 bg-[linear-gradient(180deg,#e5ddd5_0%,#d7cfc7_100%)]">
            <div className="flex h-full flex-col px-3 pb-6 pt-4">
              <p className="mx-auto mb-3 rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-medium text-neutral-500">
                Today
              </p>

              <div className="ml-auto w-[92%] rounded-lg rounded-tr-sm bg-[#d9fdd3] p-1 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]">
                <div className="overflow-hidden rounded-[6px] bg-white">
                  <div className="relative aspect-[1.91/1] w-full bg-neutral-200">
                    {imageUrl.trim() ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={imageUrl}
                        src={imageUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[11px] text-neutral-400">
                        No OpenGraph image
                      </div>
                    )}
                  </div>
                  <div className="bg-[#f0f2f5] px-2 py-[5px]">
                    <p className="m-0 line-clamp-2 text-[13px] font-semibold leading-[15px] text-[#111b21]">
                      {previewTitle}
                    </p>
                    <p className="m-0 line-clamp-2 text-[12px] leading-[14px] text-[#667781]">
                      {previewDescription}
                    </p>
                    <p className="m-0 text-[11px] leading-[13px] text-[#8696a0]">
                      {host}
                    </p>
                  </div>
                </div>
                <p className="px-2 pb-1 pt-1.5 text-[12px] leading-snug text-[#027eb5] break-all">
                  {displayPath}
                </p>
                <p className="px-2 pb-1 text-right text-[10px] text-neutral-500">
                  9:41
                </p>
              </div>

              <div className="mt-auto flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[12px] text-neutral-400">
                <span className="flex-1">Message</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapSiteSeoCard({ mapsite }: { mapsite: MapSiteSeoListItem }) {
  const [metaTitle, setMetaTitle] = useState(mapsite.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(
    mapsite.metaDescription || "",
  );
  const [ogImageUrl, setOgImageUrl] = useState(mapsite.ogImageUrl || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const previewTitle = metaTitle.trim() || mapsite.liveTitle;
  const previewDescription = metaDescription.trim() || mapsite.liveDescription;
  const previewImage = ogImageUrl.trim() || mapsite.liveOgImageUrl;
  const usingLiveTitle = !metaTitle.trim();
  const usingLiveDescription = !metaDescription.trim();
  const usingLiveImage = !ogImageUrl.trim();

  async function handleUpload(file: File) {
    setUploading(true);
    setMessage("");
    setError("");
    const formData = new FormData();
    formData.append("fastCode", mapsite.fastCode);
    formData.append("fieldName", "ogImageUrl");
    formData.append("file", file);
    const result = await uploadMapSiteAsset(formData);
    if (result.success && result.url) {
      setOgImageUrl(result.url);
      setMessage("Image uploaded");
    } else {
      setError(result.error || "Upload failed");
    }
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");
    const result = await saveMapSiteSeo({
      fastCode: mapsite.fastCode,
      metaTitle,
      metaDescription,
      ogImageUrl,
    });
    if (result.success) {
      setMessage("SEO saved");
    } else {
      setError(result.error || "Save failed");
    }
    setSaving(false);
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <WhatsAppIphonePreview
          fastCode={mapsite.fastCode}
          title={previewTitle}
          description={previewDescription}
          imageUrl={previewImage}
        />

        <div className="flex min-w-0 flex-col space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                FAST Code
              </p>
              <h2 className="mt-1 text-lg font-semibold text-neutral-900">
                {displayFastCode(mapsite.fastCode)}
              </h2>
              <p className="mt-0.5 text-sm text-neutral-500">
                {mapsite.propertyTitle?.trim() || "Untitled Mapsite™"}
              </p>
            </div>
            <Link
              href={`/admin/mapsites/${mapsite.fastCode}`}
              className="inline-flex h-9 items-center rounded-full border border-neutral-200 px-3 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Open Mapsite™
            </Link>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-neutral-500">
              Meta Title
            </span>
            <input
              className={inputClass}
              value={metaTitle}
              onChange={(event) => setMetaTitle(event.target.value)}
              placeholder={mapsite.liveTitle}
            />
            {usingLiveTitle ? (
              <p className="mt-1 text-[11px] text-neutral-400">
                Live Mapsite™ title (system assigned)
              </p>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-neutral-500">
              Meta Description
            </span>
            <textarea
              className={textareaClass}
              rows={3}
              value={metaDescription}
              onChange={(event) => setMetaDescription(event.target.value)}
              placeholder={mapsite.liveDescription}
            />
            {usingLiveDescription ? (
              <p className="mt-1 text-[11px] text-neutral-400">
                Live Mapsite™ description (system assigned)
              </p>
            ) : null}
          </label>

          <div className="rounded-xl border border-neutral-200 p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-neutral-900">OpenGraph image</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Shown when this Mapsite™ is shared on social media. Recommended
                1200×630.
                {usingLiveImage
                  ? " Using the live system-assigned image until you upload a replacement."
                  : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {previewImage ? (
                <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                  <Image
                    src={previewImage}
                    alt={`${displayFastCode(mapsite.fastCode)} OpenGraph preview`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-20 w-36 shrink-0 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-400">
                  No image
                </div>
              )}

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50">
                <Upload className="h-4 w-4" />
                {uploading
                  ? "Uploading..."
                  : ogImageUrl
                    ? "Replace image"
                    : "Upload image"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading || saving}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleUpload(file);
                    event.target.value = "";
                  }}
                />
              </label>

              {ogImageUrl ? (
                <button
                  type="button"
                  onClick={() => setOgImageUrl("")}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              ) : null}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-neutral-500">
                Or paste image URL
              </span>
              <input
                className={inputClass}
                value={ogImageUrl}
                onChange={(event) => setOgImageUrl(event.target.value)}
                placeholder="https://..."
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={saving || uploading}
              onClick={() => void handleSave()}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save SEO"}
            </button>
            {message ? (
              <p className="text-sm text-emerald-700">{message}</p>
            ) : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function MapSiteSeoAdmin({
  mapsites,
}: {
  mapsites: MapSiteSeoListItem[];
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return mapsites;
    return mapsites.filter((row) => {
      const haystack = [
        row.fastCode,
        row.propertyTitle ?? "",
        row.metaTitle ?? "",
        row.liveTitle,
        row.liveDescription,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [mapsites, query]);

  if (mapsites.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
        No Mapsites™ found. SEO is stored per FAST Code after a Mapsite™ exists.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Find a FAST Code"
        className={inputClass}
        aria-label="Find a FAST Code"
      />
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
          No Mapsite™ matches that FAST Code.
        </div>
      ) : (
        filtered.map((mapsite) => (
          <MapSiteSeoCard key={mapsite.id || mapsite.fastCode} mapsite={mapsite} />
        ))
      )}
    </div>
  );
}
